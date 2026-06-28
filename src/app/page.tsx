'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { usersApi } from '@/lib/api-client'
import type { User } from '@/models'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Modal } from '@/components/Modal'

export default function UserSelectorPage() {
  const { setActiveUser } = useUser()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formName, setFormName] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await usersApi.list()
      setUsers(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleSelectUser = (user: User) => {
    setActiveUser(user)
    router.push('/dashboard')
  }

  const openCreate = () => {
    setEditingUser(null)
    setFormName('')
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (user: User, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingUser(user)
    setFormName(user.nombre)
    setFormError(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) { setFormError('El nombre es requerido'); return }
    setFormLoading(true)
    setFormError(null)
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, { nombre: formName.trim() })
      } else {
        await usersApi.create({ nombre: formName.trim() })
      }
      setModalOpen(false)
      await loadUsers()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (user: User) => {
    try {
      await usersApi.delete(user.id)
      setDeleteConfirm(null)
      await loadUsers()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-green-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-5xl mb-3">🌿</div>
          <h1 className="text-3xl font-bold text-gray-900">DietApp</h1>
          <p className="mt-2 text-gray-500">Seleccioná tu perfil para continuar</p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadUsers} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {users.map(user => (
              <div
                key={user.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectUser(user)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelectUser(user)}
                className="group relative flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-5
                  shadow-sm hover:border-brand-400 hover:shadow-md cursor-pointer transition-all focus-visible:outline-brand-500"
              >
                <div className="h-14 w-14 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-700">
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-gray-900 text-sm">{user.nombre}</span>

                {/* Actions on hover */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openEdit(user, e)}
                    aria-label={`Editar ${user.nombre}`}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-brand-500"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(user) }}
                    aria-label={`Eliminar ${user.nombre}`}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-red-500"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            {/* Add user card */}
            <button
              onClick={openCreate}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-5
                text-gray-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all
                focus-visible:outline-brand-500"
            >
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium">Nuevo usuario</span>
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Editar usuario' : 'Nuevo usuario'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="user-name"
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Ej: Facu"
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {formError && <p className="mt-1 text-xs text-red-600">{formError}</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-brand-500"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={formLoading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white
                hover:bg-brand-700 disabled:opacity-50 focus-visible:outline-brand-500"
            >
              {formLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar usuario"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          ¿Confirmás eliminar a <strong>{deleteConfirm?.nombre}</strong>? Se borrarán todos sus datos.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-brand-500"
          >
            Cancelar
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-red-500"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}
