'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import { mealTypesApi, categoriesApi, dietApi } from '@/lib/api-client'
import type { MealType, Category } from '@/models'
import { PageHeader } from '@/components/PageHeader'
import { PageLoader } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Modal } from '@/components/Modal'
import { flattenCategoryTree, buildCategoryTree } from '@/services/categoryService'

interface MacroForm { calorias: string; proteinas: string; carbohidratos: string; grasas: string; fibra: string }
interface CategoryRuleForm { categoryId: string; requiredPortions: string }

const EMPTY_MACRO: MacroForm = { calorias: '', proteinas: '', carbohidratos: '', grasas: '', fibra: '' }

export default function DietaPage() {
  const { activeUser } = useUser()
  const [mealTypes, setMealTypes] = useState<MealType[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMt, setEditingMt] = useState<MealType | null>(null)
  const [mtForm, setMtForm] = useState({ nombre: '', orden: '0' })
  const [categoryRules, setCategoryRules] = useState<CategoryRuleForm[]>([])
  const [macroForm, setMacroForm] = useState<MacroForm>(EMPTY_MACRO)
  const [configLoading, setConfigLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!activeUser) return
    setLoading(true); setError(null)
    try {
      const [mts, cats] = await Promise.all([
        mealTypesApi.list(activeUser.id),
        categoriesApi.list(),
      ])
      setMealTypes(mts); setCategories(cats)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [activeUser])

  useEffect(() => { load() }, [load])

  const flatCats = flattenCategoryTree(buildCategoryTree(categories))

  const openCreate = () => {
    setEditingMt(null)
    setMtForm({ nombre: '', orden: mealTypes.length.toString() })
    setCategoryRules([])
    setMacroForm(EMPTY_MACRO)
    setModalError(null)
    setModalOpen(true)
  }

  const openEdit = async (mt: MealType) => {
    if (!activeUser) return
    setEditingMt(mt)
    setMtForm({ nombre: mt.nombre, orden: mt.orden.toString() })
    setCategoryRules([])
    setMacroForm(EMPTY_MACRO)
    setModalError(null)
    setConfigLoading(true)
    setModalOpen(true)
    try {
      const cfg = await dietApi.getConfig(activeUser.id, mt.id)
      setCategoryRules(cfg.categoryRules.map(r => ({ categoryId: r.categoryId, requiredPortions: r.requiredPortions.toString() })))
      setMacroForm({
        calorias: cfg.macroTarget?.calorias?.toString() ?? '',
        proteinas: cfg.macroTarget?.proteinas?.toString() ?? '',
        carbohidratos: cfg.macroTarget?.carbohidratos?.toString() ?? '',
        grasas: cfg.macroTarget?.grasas?.toString() ?? '',
        fibra: cfg.macroTarget?.fibra?.toString() ?? '',
      })
    } catch { /* deja vacío */ }
    finally { setConfigLoading(false) }
  }

  const addRule = () => {
    const unused = flatCats.find(c => !categoryRules.some(r => r.categoryId === c.id))
    if (unused) setCategoryRules(prev => [...prev, { categoryId: unused.id, requiredPortions: '1' }])
  }

  const handleSave = async () => {
    if (!activeUser) return
    if (!mtForm.nombre.trim()) { setModalError('El nombre es requerido'); return }
    setSaving(true); setModalError(null)
    try {
      let mealTypeId: string
      if (editingMt) {
        await mealTypesApi.update(editingMt.id, { nombre: mtForm.nombre.trim(), orden: parseInt(mtForm.orden) || 0 })
        mealTypeId = editingMt.id
      } else {
        const created = await mealTypesApi.create({ userId: activeUser.id, nombre: mtForm.nombre.trim(), orden: parseInt(mtForm.orden) || 0 })
        mealTypeId = created.id
      }
      await dietApi.setConfig(activeUser.id, {
        mealTypeId,
        categoryRules: categoryRules.map(r => ({ categoryId: r.categoryId, requiredPortions: parseFloat(r.requiredPortions) || 0 })),
        macroTarget: {
          calorias: macroForm.calorias ? parseFloat(macroForm.calorias) : null,
          proteinas: macroForm.proteinas ? parseFloat(macroForm.proteinas) : null,
          carbohidratos: macroForm.carbohidratos ? parseFloat(macroForm.carbohidratos) : null,
          grasas: macroForm.grasas ? parseFloat(macroForm.grasas) : null,
          fibra: macroForm.fibra ? parseFloat(macroForm.fibra) : null,
        },
      })
      setModalOpen(false)
      await load()
    } catch (e) { setModalError(e instanceof Error ? e.message : 'Error al guardar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (mt: MealType) => {
    if (!confirm(`¿Eliminar "${mt.nombre}"?`)) return
    try {
      await mealTypesApi.delete(mt.id)
      await load()
    } catch (e) { alert(e instanceof Error ? e.message : 'Error') }
  }

  return (
    <div>
      <PageHeader
        title="Mi dieta"
        subtitle="Configurá los objetivos de porciones y macros por tipo de comida"
      />

      {loading ? <PageLoader /> : error ? <ErrorMessage message={error} onRetry={load} /> : (
        <div className="space-y-3">
          {mealTypes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500 mb-3">No hay tipos de comida configurados todavía.</p>
              <button onClick={openCreate} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                + Crear primer tipo de comida
              </button>
            </div>
          ) : (
            <>
              {mealTypes.map(mt => (
                <div key={mt.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{mt.nombre}</p>
                    <p className="text-xs text-gray-400">orden {mt.orden}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(mt)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Configurar
                    </button>
                    <button
                      onClick={() => handleDelete(mt)}
                      className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Eliminar ${mt.nombre}`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={openCreate}
                className="w-full rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600"
              >
                + Agregar tipo de comida
              </button>
            </>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMt ? `Configurar ${editingMt.nombre}` : 'Nuevo tipo de comida'}
        size="lg"
      >
        <div className="space-y-5">
          {/* Nombre + Orden */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={mtForm.nombre}
                onChange={e => setMtForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Almuerzo"
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
              <input
                type="number"
                min="0"
                value={mtForm.orden}
                onChange={e => setMtForm(f => ({ ...f, orden: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {configLoading ? (
            <p className="text-sm text-center text-gray-400 py-4">Cargando objetivos...</p>
          ) : (
            <>
              {/* Porciones por categoría */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">Porciones por categoría</h3>
                  <button onClick={addRule} className="text-xs text-brand-600 hover:text-brand-800">
                    + Agregar
                  </button>
                </div>
                {categoryRules.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg text-center py-3">
                    Sin reglas — hacé click en &quot;+ Agregar&quot; para configurar
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categoryRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={rule.categoryId}
                          onChange={e => setCategoryRules(prev => prev.map((r, i) => i === idx ? { ...r, categoryId: e.target.value } : r))}
                          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                        >
                          {flatCats.map(c => (
                            <option key={c.id} value={c.id}>{'  '.repeat(c.depth)}{c.nombre}</option>
                          ))}
                        </select>
                        <input
                          type="number" min="0" step="0.5"
                          value={rule.requiredPortions}
                          onChange={e => setCategoryRules(prev => prev.map((r, i) => i === idx ? { ...r, requiredPortions: e.target.value } : r))}
                          className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-brand-500 focus:outline-none"
                        />
                        <span className="text-xs text-gray-400 shrink-0">porc.</span>
                        <button
                          onClick={() => setCategoryRules(prev => prev.filter((_, i) => i !== idx))}
                          className="rounded p-1 text-gray-300 hover:text-red-500"
                          aria-label="Quitar regla"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Objetivo de macros */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Objetivo de macros{' '}
                  <span className="font-normal text-gray-400">(dejá en blanco lo que no querés controlar)</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'calorias', label: 'Calorías', unit: 'kcal' },
                    { key: 'proteinas', label: 'Proteínas', unit: 'g' },
                    { key: 'carbohidratos', label: 'Carbohidratos', unit: 'g' },
                    { key: 'grasas', label: 'Grasas', unit: 'g' },
                    { key: 'fibra', label: 'Fibra', unit: 'g' },
                  ] as const).map(({ key, label, unit }) => (
                    <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <label className="text-xs text-gray-600 w-24 shrink-0">{label}</label>
                      <input
                        type="number" min="0" step="0.1"
                        value={macroForm[key]}
                        onChange={e => setMacroForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="—"
                        className="flex-1 min-w-0 bg-transparent text-sm text-right focus:outline-none"
                      />
                      <span className="text-xs text-gray-400 shrink-0">{unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {modalError && <p className="text-xs text-red-600">{modalError}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || configLoading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
