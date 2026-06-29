'use client'

import { useState, useEffect, useCallback } from 'react'
import { ingredientsApi, categoriesApi } from '@/lib/api-client'
import type { Ingredient, Category } from '@/models'
import { PageHeader } from '@/components/PageHeader'
import { PageLoader } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { flattenCategoryTree, buildCategoryTree } from '@/services/categoryService'

const EMPTY_MACROS = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 }

export default function IngredientesPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null)
  const [form, setForm] = useState({
    nombre: '', categoryId: '', gramsPerPortion: '100',
    macros: { ...EMPTY_MACROS },
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Ingredient | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [ings, cats] = await Promise.all([ingredientsApi.list(), categoriesApi.list()])
      setIngredients(ings); setCategories(cats)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const catMap = new Map(categories.map(c => [c.id, c.nombre]))
  const flatCats = flattenCategoryTree(buildCategoryTree(categories))

  const sortedCats = [...categories].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const filtered = ingredients.filter(i => {
    if (search && !i.nombre.toLowerCase().includes(search.toLowerCase())) return false
    if (selectedCat && i.categoryId !== selectedCat) return false
    return true
  })

  const openCreate = () => {
    setEditingIng(null)
    setForm({ nombre: '', categoryId: flatCats[0]?.id ?? '', gramsPerPortion: '100', macros: { ...EMPTY_MACROS } })
    setFormError(null); setModalOpen(true)
  }

  const openEdit = (ing: Ingredient) => {
    setEditingIng(ing)
    setForm({
      nombre: ing.nombre,
      categoryId: ing.categoryId,
      gramsPerPortion: ing.gramsPerPortion.toString(),
      macros: { ...ing.macros },
    })
    setFormError(null); setModalOpen(true)
  }

  const setMacro = (key: keyof typeof EMPTY_MACROS, val: string) => {
    setForm(f => ({ ...f, macros: { ...f.macros, [key]: parseFloat(val) || 0 } }))
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) { setFormError('El nombre es requerido'); return }
    if (!form.categoryId) { setFormError('Seleccioná una categoría'); return }
    setFormLoading(true); setFormError(null)
    try {
      const dto = {
        nombre: form.nombre.trim(),
        categoryId: form.categoryId,
        macros: form.macros,
        gramsPerPortion: parseFloat(form.gramsPerPortion) || 100,
      }
      if (editingIng) await ingredientsApi.update(editingIng.id, dto)
      else await ingredientsApi.create(dto)
      setModalOpen(false); await load()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Error') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (ing: Ingredient) => {
    try { await ingredientsApi.delete(ing.id); setDeleteConfirm(null); await load() }
    catch (e) { alert(e instanceof Error ? e.message : 'Error') }
  }

  const macroFields: { key: keyof typeof EMPTY_MACROS; label: string; unit: string }[] = [
    { key: 'calorias', label: 'Calorías', unit: 'kcal' },
    { key: 'proteinas', label: 'Proteínas', unit: 'g' },
    { key: 'carbohidratos', label: 'Carbohidratos', unit: 'g' },
    { key: 'grasas', label: 'Grasas', unit: 'g' },
    { key: 'fibra', label: 'Fibra', unit: 'g' },
  ]

  return (
    <div>
      <PageHeader
        title="Ingredientes"
        subtitle="Macros por 100 g + gramos por porción"
        action={
          <button onClick={openCreate} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-brand-500">
            + Nuevo
          </button>
        }
      />

      {/* Search + filtro categoría */}
      <div className="mb-4 space-y-2">
        <input
          type="search"
          placeholder="Buscar ingrediente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {sortedCats.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCat(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedCat === null ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Todas
            </button>
            {sortedCats.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id === selectedCat ? null : c.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedCat === c.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? <PageLoader /> : error ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState title={search ? 'Sin resultados' : 'Sin ingredientes'} description={search ? 'Probá con otro término' : 'Creá el primer ingrediente'} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Ingrediente</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Categoría</th>
                <th className="px-4 py-3 text-right">Cal</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Prot</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Carb</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Gras</th>
                <th className="px-4 py-3 text-right hidden lg:table-cell">Porción</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(ing => (
                <tr key={ing.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{ing.nombre}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{catMap.get(ing.categoryId) ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{ing.macros.calorias}</td>
                  <td className="px-4 py-3 text-right text-gray-700 hidden md:table-cell">{ing.macros.proteinas}g</td>
                  <td className="px-4 py-3 text-right text-gray-700 hidden md:table-cell">{ing.macros.carbohidratos}g</td>
                  <td className="px-4 py-3 text-right text-gray-700 hidden md:table-cell">{ing.macros.grasas}g</td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">{ing.gramsPerPortion}g</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(ing)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label={`Editar ${ing.nombre}`}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setDeleteConfirm(ing)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar ${ing.nombre}`}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingIng ? 'Editar ingrediente' : 'Nuevo ingrediente'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Pechuga de pollo" autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option value="">Seleccioná...</option>
                {flatCats.map(n => <option key={n.id} value={n.id}>{'  '.repeat(n.depth)}{n.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gramos por porción</label>
              <input type="number" min="1" step="1" value={form.gramsPerPortion}
                onChange={e => setForm(f => ({ ...f, gramsPerPortion: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Macros por 100 g</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {macroFields.map(({ key, label, unit }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label} ({unit})</label>
                  <input type="number" min="0" step="0.01" value={form.macros[key]}
                    onChange={e => setMacro(key, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
              ))}
            </div>
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
            <button onClick={handleSave} disabled={formLoading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
              {formLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar ingrediente" size="sm">
        <p className="text-sm text-gray-600 mb-4">¿Eliminar <strong>{deleteConfirm?.nombre}</strong>?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteConfirm(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Eliminar</button>
        </div>
      </Modal>
    </div>
  )
}
