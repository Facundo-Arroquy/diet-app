'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@/hooks/useUser'
import { ingredientsApi, categoriesApi, mealTypesApi, mealLogsApi, analysisApi } from '@/lib/api-client'
import type { Ingredient, Category, MealType, MealLogWithAnalysis, AnalysisResult } from '@/models'
import { PageHeader } from '@/components/PageHeader'
import { PageLoader } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { AnalysisView } from '@/components/AnalysisView'
import { Modal } from '@/components/Modal'
import { flattenCategoryTree, buildCategoryTree } from '@/services/categoryService'

interface LogItem { ingredientId: string; grams: number }

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function RegistroPage() {
  const { activeUser } = useUser()

  // Master data
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [mealTypes, setMealTypes] = useState<MealType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form
  const [selectedMealTypeId, setSelectedMealTypeId] = useState('')
  const [fecha, setFecha] = useState(today())
  const [items, setItems] = useState<LogItem[]>([])
  const [searchIng, setSearchIng] = useState('')
  const [addGrams, setAddGrams] = useState('')
  const [selectedIngId, setSelectedIngId] = useState('')

  // Analysis
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const analysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Result modal
  const [resultModal, setResultModal] = useState<MealLogWithAnalysis | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!activeUser) return
    setLoading(true); setError(null)
    try {
      const [ings, cats, mts] = await Promise.all([
        ingredientsApi.list(),
        categoriesApi.list(),
        mealTypesApi.list(activeUser.id),
      ])
      setIngredients(ings); setCategories(cats); setMealTypes(mts)
      if (mts.length > 0) setSelectedMealTypeId(mts[0].id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [activeUser])

  useEffect(() => { load() }, [load])

  const ingMap = new Map(ingredients.map(i => [i.id, i]))
  const catMap = new Map(categories.map(c => [c.id, c.nombre]))
  const flatCats = flattenCategoryTree(buildCategoryTree(categories))

  // Live analysis preview with debounce
  useEffect(() => {
    if (!activeUser || !selectedMealTypeId || items.length === 0) {
      setAnalysis(null); return
    }
    if (analysisTimer.current) clearTimeout(analysisTimer.current)
    analysisTimer.current = setTimeout(async () => {
      setAnalysisLoading(true)
      try {
        const result = await analysisApi.preview({ userId: activeUser.id, mealTypeId: selectedMealTypeId, items })
        setAnalysis(result)
      } catch { setAnalysis(null) }
      finally { setAnalysisLoading(false) }
    }, 600)
    return () => { if (analysisTimer.current) clearTimeout(analysisTimer.current) }
  }, [activeUser, selectedMealTypeId, items])

  const filteredIngs = ingredients.filter(i =>
    i.nombre.toLowerCase().includes(searchIng.toLowerCase())
  )

  const addItem = () => {
    if (!selectedIngId) return
    const grams = parseFloat(addGrams)
    if (!grams || grams <= 0) return
    setItems(prev => {
      const existing = prev.findIndex(it => it.ingredientId === selectedIngId)
      if (existing >= 0) {
        return prev.map((it, i) => i === existing ? { ...it, grams: it.grams + grams } : it)
      }
      return [...prev, { ingredientId: selectedIngId, grams }]
    })
    setAddGrams('')
    setSearchIng('')
    setSelectedIngId('')
  }

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const updateGrams = (idx: number, grams: string) => {
    const val = parseFloat(grams)
    if (val > 0) setItems(prev => prev.map((it, i) => i === idx ? { ...it, grams: val } : it))
  }

  const handleSave = async () => {
    if (!activeUser || !selectedMealTypeId || items.length === 0) return
    setSaving(true); setSaveError(null)
    try {
      const result = await mealLogsApi.create({
        userId: activeUser.id,
        mealTypeId: selectedMealTypeId,
        fecha,
        items,
      })
      setResultModal(result)
      setItems([])
      setAnalysis(null)
    } catch (e) { setSaveError(e instanceof Error ? e.message : 'Error al guardar') }
    finally { setSaving(false) }
  }

  const mealTypeName = (id: string) => mealTypes.find(m => m.id === id)?.nombre ?? ''

  return (
    <div>
      <PageHeader
        title="Registrar comida"
        subtitle="Agregá ingredientes y revisá el análisis en tiempo real"
      />

      {loading ? <PageLoader /> : error ? <ErrorMessage message={error} onRetry={load} /> : (
        <div className="grid gap-6 lg:grid-cols-2">

          {/* LEFT: Form */}
          <div className="space-y-5">
            {/* Tipo y fecha */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de comida</label>
                {mealTypes.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay tipos configurados. Andá a <strong>Mi dieta</strong> para crearlos.</p>
                ) : (
                  <select
                    value={selectedMealTypeId}
                    onChange={e => setSelectedMealTypeId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {mealTypes.map(mt => <option key={mt.id} value={mt.id}>{mt.nombre}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Agregar ingrediente */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Agregar ingrediente</h2>
              <div className="space-y-3">
                <div>
                  <input
                    type="search"
                    placeholder="Buscar ingrediente..."
                    value={searchIng}
                    onChange={e => { setSearchIng(e.target.value); setSelectedIngId('') }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {searchIng && (
                    <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-md">
                      {filteredIngs.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
                      ) : filteredIngs.map(ing => (
                        <button
                          key={ing.id}
                          onClick={() => { setSelectedIngId(ing.id); setSearchIng(ing.nombre); setAddGrams(ing.gramsPerPortion.toString()) }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 ${selectedIngId === ing.id ? 'bg-brand-50 text-brand-700' : 'text-gray-700'}`}
                        >
                          <span className="font-medium">{ing.nombre}</span>
                          <span className="ml-2 text-xs text-gray-400">{catMap.get(ing.categoryId)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number" min="1" step="1"
                      placeholder="Gramos"
                      value={addGrams}
                      onChange={e => setAddGrams(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addItem()}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <button
                    onClick={addItem}
                    disabled={!selectedIngId || !addGrams}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40 focus-visible:outline-brand-500"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Selected items */}
              {items.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Ingredientes</h3>
                  <div className="space-y-1">
                    {items.map((item, idx) => {
                      const ing = ingMap.get(item.ingredientId)
                      return (
                        <div key={idx} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                          <span className="flex-1 text-sm font-medium text-gray-800 truncate">{ing?.nombre ?? '—'}</span>
                          <input
                            type="number" min="1" step="1"
                            value={item.grams}
                            onChange={e => updateGrams(idx, e.target.value)}
                            className="w-16 rounded border border-gray-300 px-1.5 py-1 text-xs text-center focus:border-brand-500 focus:outline-none"
                          />
                          <span className="text-xs text-gray-400">g</span>
                          <button
                            onClick={() => removeItem(idx)}
                            className="rounded p-1 text-gray-300 hover:text-red-500 focus-visible:outline-red-500"
                            aria-label="Quitar ingrediente"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Save */}
            {items.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !selectedMealTypeId}
                  className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 focus-visible:outline-brand-500"
                >
                  {saving ? 'Guardando...' : 'Guardar comida'}
                </button>
                {saveError && <span className="text-sm text-red-600">{saveError}</span>}
              </div>
            )}
          </div>

          {/* RIGHT: Analysis preview */}
          <div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                Análisis en vivo
                {analysisLoading && <span className="ml-2 text-xs text-gray-400 animate-pulse">calculando...</span>}
              </h2>
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-sm text-gray-400">Agregá ingredientes para ver el análisis</p>
                </div>
              ) : analysis ? (
                <AnalysisView result={analysis} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm text-gray-400">
                    {analysisLoading ? 'Calculando...' : 'Sin datos de dieta configurados para esta comida'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result modal after saving */}
      <Modal
        open={!!resultModal}
        onClose={() => setResultModal(null)}
        title={`¡Comida registrada! — ${mealTypeName(resultModal?.mealLog.mealTypeId ?? '')}`}
        size="lg"
      >
        {resultModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Registraste {resultModal.mealLog.items.length} ingrediente{resultModal.mealLog.items.length !== 1 ? 's' : ''} para el {resultModal.mealLog.fecha}.
            </p>
            <AnalysisView result={resultModal.analysis} />
            <div className="flex justify-end">
              <button
                onClick={() => setResultModal(null)}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-brand-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
