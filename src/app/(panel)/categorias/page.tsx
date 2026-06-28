'use client'

import { useState, useEffect, useCallback } from 'react'
import { categoriesApi } from '@/lib/api-client'
import type { Category } from '@/models'
import { PageHeader } from '@/components/PageHeader'
import { PageLoader } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { buildCategoryTree, flattenCategoryTree, type CategoryNode } from '@/services/categoryService'

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [formName, setFormName] = useState('')
  const [formParentId, setFormParentId] = useState<string>('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setCategories(await categoriesApi.list()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const flatTree = flattenCategoryTree(buildCategoryTree(categories))

  const openCreate = () => {
    setEditingCat(null); setFormName(''); setFormParentId(''); setFormError(null); setModalOpen(true)
  }
  const openEdit = (cat: Category) => {
    setEditingCat(cat); setFormName(cat.nombre); setFormParentId(cat.parentId ?? ''); setFormError(null); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) { setFormError('El nombre es requerido'); return }
    setFormLoading(true); setFormError(null)
    try {
      const dto = { nombre: formName.trim(), parentId: formParentId || null }
      if (editingCat) await categoriesApi.update(editingCat.id, dto)
      else await categoriesApi.create(dto)
      setModalOpen(false); await load()
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Error') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (cat: Category) => {
    try { await categoriesApi.delete(cat.id); setDeleteConfirm(null); await load() }
    catch (e) { alert(e instanceof Error ? e.message : 'Error') }
  }

  function renderIndent(node: CategoryNode) {
    return '—'.repeat(node.depth) + (node.depth > 0 ? ' ' : '')
  }

  return (
    <div>
      <PageHeader
        title="Categorías"
        subtitle="Organizá los alimentos en categorías con jerarquía"
        action={
          <button
            onClick={openCreate}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-brand-500"
          >
            + Nueva categoría
          </button>
        }
      />

      {loading ? <PageLoader /> : error ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : flatTree.length === 0 ? (
        <EmptyState title="Sin categorías" description="Creá la primera para organizar tus ingredientes" />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {flatTree.map(node => (
            <div key={node.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="text-gray-300 font-mono text-xs">{renderIndent(node)}</span>
                <span className={`font-medium text-gray-900 ${node.depth === 0 ? 'text-sm' : 'text-sm text-gray-700'}`}>
                  {node.nombre}
                </span>
                {node.depth === 0 && (
                  <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                    {categories.filter(c => c.parentId === node.id).length} sub
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(node)}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-brand-500"
                  aria-label={`Editar ${node.nombre}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteConfirm(node)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-red-500"
                  aria-label={`Eliminar ${node.nombre}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingCat ? 'Editar categoría' : 'Nueva categoría'} size="sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="cat-nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              id="cat-nombre"
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Ej: Proteínas animales"
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="cat-parent" className="block text-sm font-medium text-gray-700 mb-1">Categoría padre (opcional)</label>
            <select
              id="cat-parent"
              value={formParentId}
              onChange={e => setFormParentId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">— Sin padre (categoría raíz)</option>
              {flatTree
                .filter(n => n.id !== editingCat?.id)
                .map(n => (
                  <option key={n.id} value={n.id}>
                    {'  '.repeat(n.depth)}{n.nombre}
                  </option>
                ))}
            </select>
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

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar categoría" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          ¿Eliminar <strong>{deleteConfirm?.nombre}</strong>? Los ingredientes de esta categoría no se podrán borrar si están en uso.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setDeleteConfirm(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancelar</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Eliminar</button>
        </div>
      </Modal>
    </div>
  )
}
