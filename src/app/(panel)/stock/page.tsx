'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@/hooks/useUser'
import { stockApi, ingredientsApi, categoriesApi } from '@/lib/api-client'
import type { StockItem, Ingredient, Category } from '@/models'
import { PageLoader } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Modal } from '@/components/Modal'

const UNIDADES = ['u', 'kg', 'g', 'L', 'ml', 'docena', 'paquete'] as const
type Unidad = typeof UNIDADES[number]

function stepForUnit(unidad: string): number {
  if (unidad === 'kg' || unidad === 'L') return 0.5
  if (unidad === 'g' || unidad === 'ml') return 100
  return 1
}

interface ItemForm {
  ingredientId: string
  cantidad: string
  unidad: Unidad
  minimo: string
}

const EMPTY_FORM: ItemForm = { ingredientId: '', cantidad: '0', unidad: 'u', minimo: '0' }

export default function StockPage() {
  const { activeUser } = useUser()
  const [items, setItems] = useState<StockItem[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [selectedCatShopping, setSelectedCatShopping] = useState<string | null>(null)

  // Modal agregar/editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Combobox de ingredientes
  const [ingrSearch, setIngrSearch] = useState('')
  const [ingrOpen, setIngrOpen] = useState(false)
  const comboRef = useRef<HTMLDivElement>(null)

  // Modal "Compré"
  const [buyModal, setBuyModal] = useState<StockItem | null>(null)
  const [buyQty, setBuyQty] = useState('')

  const load = useCallback(async () => {
    if (!activeUser) return
    setLoading(true); setError(null)
    try {
      const [stockItems, ingrs, cats] = await Promise.all([
        stockApi.list(activeUser.id),
        ingredientsApi.list(),
        categoriesApi.list(),
      ])
      setItems(stockItems)
      setIngredients(ingrs)
      setCategories(cats)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [activeUser])

  useEffect(() => { load() }, [load])

  // IDs de ingredientes ya trackeados
  const trackedIds = new Set(items.map(i => i.ingredientId))
  const availableIngredients = ingredients
    .filter(i => !trackedIds.has(i.id) || (editingItem && editingItem.ingredientId === i.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const filteredIngredients = availableIngredients.filter(i =>
    i.nombre.toLowerCase().includes(ingrSearch.toLowerCase())
  )

  const selectedIngredientNombre = ingredients.find(i => i.id === form.ingredientId)?.nombre ?? ''

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setIngrOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mapa ingredientId → categoryId para filtrar por categoría en stock
  const ingrCatMap = new Map(ingredients.map(i => [i.id, i.categoryId]))
  // Solo categorías que tienen al menos un item en stock
  const usedCatIds = new Set(items.map(i => ingrCatMap.get(i.ingredientId)).filter(Boolean))
  const visibleCats = categories.filter(c => usedCatIds.has(c.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const shoppingListAll = items.filter(i => i.minimo > 0 && i.cantidad <= i.minimo)
  const shoppingCatIds = new Set(shoppingListAll.map(i => ingrCatMap.get(i.ingredientId)).filter(Boolean))
  const shoppingCats = categories.filter(c => shoppingCatIds.has(c.id))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const shoppingList = shoppingListAll.filter(i =>
    !selectedCatShopping || ingrCatMap.get(i.ingredientId) === selectedCatShopping
  )
  const filteredItems = items.filter(i => {
    if (search && !i.ingredientNombre.toLowerCase().includes(search.toLowerCase())) return false
    if (selectedCat && ingrCatMap.get(i.ingredientId) !== selectedCat) return false
    return true
  })

  // ── Ajuste rápido de cantidad ──────────────────────────────

  const adjustCantidad = async (item: StockItem, delta: number) => {
    const step = stepForUnit(item.unidad)
    const next = Math.max(0, Math.round((item.cantidad + delta * step) * 1000) / 1000)
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, cantidad: next } : i))
    try {
      await stockApi.update(item.id, { cantidad: next })
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, cantidad: item.cantidad } : i))
    }
  }

  // ── Modal agregar/editar ───────────────────────────────────

  const openCreate = () => {
    setEditingItem(null)
    setForm(EMPTY_FORM)
    setIngrSearch('')
    setIngrOpen(false)
    setModalError(null)
    setModalOpen(true)
  }

  const openEdit = (item: StockItem) => {
    setEditingItem(item)
    setForm({
      ingredientId: item.ingredientId,
      cantidad: item.cantidad.toString(),
      unidad: item.unidad as Unidad,
      minimo: item.minimo.toString(),
    })
    setModalError(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!activeUser) return
    const cantidad = parseFloat(form.cantidad) || 0
    const minimo = parseFloat(form.minimo) || 0
    if (!form.ingredientId) { setModalError('Seleccioná un ingrediente'); return }
    setSaving(true); setModalError(null)
    try {
      if (editingItem) {
        const updated = await stockApi.update(editingItem.id, { cantidad, unidad: form.unidad, minimo })
        setItems(prev => prev.map(i => i.id === editingItem.id ? updated : i))
      } else {
        const created = await stockApi.create({ userId: activeUser.id, ingredientId: form.ingredientId, cantidad, unidad: form.unidad, minimo })
        setItems(prev => [...prev, created])
      }
      setModalOpen(false)
    } catch (e) { setModalError(e instanceof Error ? e.message : 'Error al guardar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (item: StockItem) => {
    if (!confirm(`¿Eliminar "${item.ingredientNombre}" del stock?`)) return
    setItems(prev => prev.filter(i => i.id !== item.id))
    try {
      await stockApi.delete(item.id)
    } catch {
      setItems(prev => [...prev, item])
    }
  }

  // ── Modal "Compré" ─────────────────────────────────────────

  const openBuy = (item: StockItem) => {
    setBuyModal(item)
    setBuyQty('')
  }

  const handleBuy = async () => {
    if (!buyModal) return
    const qty = parseFloat(buyQty) || 0
    if (qty <= 0) return
    const next = Math.round((buyModal.cantidad + qty) * 1000) / 1000
    setItems(prev => prev.map(i => i.id === buyModal.id ? { ...i, cantidad: next } : i))
    setBuyModal(null)
    try {
      await stockApi.update(buyModal.id, { cantidad: next })
    } catch {
      setItems(prev => prev.map(i => i.id === buyModal.id ? { ...i, cantidad: buyModal.cantidad } : i))
    }
  }

  // Toggle mobile: 'stock' | 'shopping'
  const [mobileView, setMobileView] = useState<'stock' | 'shopping'>('stock')

  // ── Render ─────────────────────────────────────────────────

  if (loading) return <PageLoader />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row gap-4 overflow-hidden">

      {/* ══ TABS MOBILE (solo visible en mobile) ══════════════ */}
      <div className="flex md:hidden shrink-0 rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <button
          onClick={() => setMobileView('stock')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${mobileView === 'stock' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          📦 En stock
          <span className="ml-1.5 text-xs opacity-70">({items.length})</span>
        </button>
        <button
          onClick={() => setMobileView('shopping')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${mobileView === 'shopping' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          🛒 Compras
          {shoppingListAll.length > 0 && (
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${mobileView === 'shopping' ? 'bg-white/30 text-white' : 'bg-red-100 text-red-700'}`}>
              {shoppingListAll.length}
            </span>
          )}
        </button>
      </div>

      {/* ══ PANEL IZQUIERDO: Lista de compras ══════════════════ */}
      <div className={`${mobileView === 'shopping' ? 'flex' : 'hidden'} md:flex w-full md:w-1/2 flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden`}>
        <div className="border-b border-gray-100 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <h2 className="font-semibold text-gray-900">Lista de compras</h2>
            {shoppingListAll.length > 0 && (
              <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {shoppingListAll.length}
              </span>
            )}
          </div>
          {shoppingCats.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => setSelectedCatShopping(null)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedCatShopping === null ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Todas
              </button>
              {shoppingCats.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCatShopping(c.id === selectedCatShopping ? null : c.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedCatShopping === c.id ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {shoppingList.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <p className="text-3xl mb-3">✅</p>
              <p className="text-sm text-gray-400">Todo el stock está abastecido</p>
            </div>
          ) : (
            shoppingList.map(item => (
              <div
                key={item.id}
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.ingredientNombre}</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Tenés {item.cantidad} {item.unidad} · mínimo {item.minimo} {item.unidad}
                  </p>
                </div>
                <button
                  onClick={() => openBuy(item)}
                  className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 active:scale-95 transition-transform"
                >
                  Compré
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ══ PANEL DERECHO: En stock ═════════════════════════════ */}
      <div className={`${mobileView === 'stock' ? 'flex' : 'hidden'} md:flex w-full md:w-1/2 flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden`}>
        <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-2">
          <span className="text-lg">📦</span>
          <h2 className="font-semibold text-gray-900">En stock</h2>
          <span className="text-xs text-gray-400">({items.length})</span>
          <button
            onClick={openCreate}
            className="ml-auto rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Agregar
          </button>
        </div>

        {/* Buscador + filtro categoría */}
        <div className="px-3 pt-3 pb-2 space-y-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar ingrediente..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
          {visibleCats.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => setSelectedCat(null)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedCat === null ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Todas
              </button>
              {visibleCats.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id === selectedCat ? null : c.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedCat === c.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <p className="text-3xl mb-3">📭</p>
              <p className="text-sm text-gray-400">
                {items.length === 0 ? 'Aún no hay insumos registrados' : 'No hay resultados'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => {
              const step = stepForUnit(item.unidad)
              const low = item.minimo > 0 && item.cantidad <= item.minimo
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${low ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.ingredientNombre}</p>
                    {item.minimo > 0 && (
                      <p className={`text-xs mt-0.5 ${low ? 'text-red-500' : 'text-gray-400'}`}>
                        mín. {item.minimo} {item.unidad}
                      </p>
                    )}
                  </div>

                  {/* Controles +/- */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => adjustCantidad(item, -1)}
                      className="h-10 w-10 rounded-xl border border-gray-200 bg-white text-xl font-bold text-gray-600 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center"
                      aria-label="Reducir"
                    >
                      −
                    </button>
                    <span className="w-20 text-center font-semibold text-gray-900 text-sm">
                      {item.cantidad} {item.unidad}
                    </span>
                    <button
                      onClick={() => adjustCantidad(item, +1)}
                      className="h-10 w-10 rounded-xl border border-gray-200 bg-white text-xl font-bold text-gray-600 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center"
                      aria-label="Aumentar"
                    >
                      +
                    </button>
                  </div>

                  {/* Editar / Eliminar */}
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(item)}
                      className="h-9 w-9 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 flex items-center justify-center"
                      aria-label="Editar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="h-9 w-9 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
                      aria-label="Eliminar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ══ Modal agregar / editar ══════════════════════════════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `Editar ${editingItem.ingredientNombre}` : 'Agregar insumo'}
        size="sm"
      >
        <div className="space-y-4">
          {!editingItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingrediente</label>
              <div ref={comboRef} className="relative">
                <input
                  type="text"
                  value={ingrOpen ? ingrSearch : selectedIngredientNombre}
                  onChange={e => { setIngrSearch(e.target.value); setIngrOpen(true) }}
                  onFocus={() => { setIngrSearch(''); setIngrOpen(true) }}
                  placeholder="Buscar ingrediente..."
                  autoComplete="off"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {ingrOpen && (
                  <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredIngredients.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-gray-400">Sin resultados</li>
                    ) : (
                      filteredIngredients.map(i => (
                        <li
                          key={i.id}
                          onMouseDown={() => {
                            setForm(f => ({ ...f, ingredientId: i.id }))
                            setIngrSearch('')
                            setIngrOpen(false)
                          }}
                          className={`cursor-pointer px-3 py-2 text-sm hover:bg-brand-50 hover:text-brand-700 ${form.ingredientId === i.id ? 'bg-brand-50 font-medium text-brand-700' : 'text-gray-800'}`}
                        >
                          {i.nombre}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number" min="0" step="0.5"
                value={form.cantidad}
                onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <select
                value={form.unidad}
                onChange={e => setForm(f => ({ ...f, unidad: e.target.value as Unidad }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mínimo deseado <span className="font-normal text-gray-400">(para lista de compras)</span>
            </label>
            <input
              type="number" min="0" step="0.5"
              value={form.minimo}
              onChange={e => setForm(f => ({ ...f, minimo: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          {modalError && <p className="text-xs text-red-600">{modalError}</p>}

          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══ Modal "Compré" ══════════════════════════════════════ */}
      <Modal
        open={buyModal !== null}
        onClose={() => setBuyModal(null)}
        title={`Compré ${buyModal?.ingredientNombre ?? ''}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Stock actual: <strong>{buyModal?.cantidad} {buyModal?.unidad}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad comprada ({buyModal?.unidad})
            </label>
            <input
              type="number" min="0" step="0.5"
              value={buyQty}
              onChange={e => setBuyQty(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-lg font-semibold text-center focus:border-brand-500 focus:outline-none"
              placeholder="0"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setBuyModal(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Cancelar
            </button>
            <button
              onClick={handleBuy}
              disabled={!buyQty || parseFloat(buyQty) <= 0}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Agregar al stock
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
