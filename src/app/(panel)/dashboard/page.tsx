'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { mealLogsApi, mealTypesApi, ingredientsApi } from '@/lib/api-client'
import type { MealLog, MealType, Ingredient } from '@/models'
import { PageHeader } from '@/components/PageHeader'
import { PageLoader } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'

function formatDate(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
}

export default function DashboardPage() {
  const { activeUser } = useUser()
  const [logs, setLogs] = useState<MealLog[]>([])
  const [mealTypes, setMealTypes] = useState<MealType[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!activeUser) return
    setLoading(true)
    setError(null)
    try {
      const [logsData, typesData, ingrData] = await Promise.all([
        mealLogsApi.list(activeUser.id),
        mealTypesApi.list(activeUser.id),
        ingredientsApi.list(),
      ])
      setLogs(logsData)
      setMealTypes(typesData)
      setIngredients(ingrData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [activeUser])

  useEffect(() => { load() }, [load])

  const mealTypeMap = new Map(mealTypes.map(mt => [mt.id, mt.nombre]))
  const ingredientMap = new Map(ingredients.map(i => [i.id, i]))

  const today = new Date().toISOString().split('T')[0]
  const todayLogs = logs.filter(l => l.fecha === today)
  const recentLogs = logs.slice(0, 10)

  const toggleLog = (id: string) => setExpandedLogId(prev => prev === id ? null : id)

  return (
    <div>
      <PageHeader
        title={`Hola, ${activeUser?.nombre} 👋`}
        subtitle="Resumen de tu día"
      />

      {loading ? <PageLoader /> : error ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard icon="📋" label="Comidas hoy" value={todayLogs.length.toString()} />
            <StatCard icon="🥗" label="Tipos de comida" value={mealTypes.length.toString()} />
            <StatCard icon="📅" label="Total registros" value={logs.length.toString()} />
          </div>

          {/* Quick actions */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Accesos rápidos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: '/registro',     icon: '✍️',  label: 'Registrar comida' },
                { href: '/dieta',        icon: '🎯',  label: 'Mi dieta' },
                { href: '/stock',        icon: '📦',  label: 'Stock' },
                { href: '/ingredientes', icon: '🥦',  label: 'Ingredientes' },
              ].map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4
                    hover:border-brand-400 hover:shadow-sm transition-all text-center focus-visible:outline-brand-500"
                >
                  <span className="text-2xl" aria-hidden="true">{icon}</span>
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent logs */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Últimas comidas
            </h2>
            {recentLogs.length === 0 ? (
              <EmptyState
                title="Sin registros todavía"
                description="Empezá registrando tu primera comida"
                action={<Link href="/registro" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Registrar comida</Link>}
              />
            ) : (
              <div className="space-y-2">
                {recentLogs.map(log => {
                  const isExpanded = expandedLogId === log.id
                  return (
                    <div key={log.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <button
                        onClick={() => toggleLog(log.id)}
                        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg" aria-hidden="true">🍽️</span>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {mealTypeMap.get(log.mealTypeId) ?? 'Comida'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(log.fecha)} · {log.items.length} ingrediente{log.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${log.fecha === today ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                            {log.fecha === today ? 'Hoy' : log.fecha}
                          </span>
                          <svg
                            className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                          {log.items.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-2">Sin ingredientes</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-gray-500 uppercase tracking-wider">
                                  <th className="text-left pb-2 font-medium">Ingrediente</th>
                                  <th className="text-right pb-2 font-medium">g</th>
                                  <th className="text-right pb-2 font-medium hidden sm:table-cell">Kcal</th>
                                  <th className="text-right pb-2 font-medium hidden sm:table-cell">Prot.</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {log.items.map(item => {
                                  const ingr = ingredientMap.get(item.ingredientId)
                                  const kcal = ingr ? Math.round(ingr.macros.calorias * item.grams / 100) : null
                                  const prot = ingr ? Math.round(ingr.macros.proteinas * item.grams / 100 * 10) / 10 : null
                                  return (
                                    <tr key={item.id}>
                                      <td className="py-1.5 text-gray-800 max-w-[140px] truncate">{ingr?.nombre ?? item.ingredientId}</td>
                                      <td className="py-1.5 text-right text-gray-600">{item.grams}g</td>
                                      <td className="py-1.5 text-right text-gray-600 hidden sm:table-cell">{kcal ?? '—'}</td>
                                      <td className="py-1.5 text-right text-gray-600 hidden sm:table-cell">{prot != null ? `${prot}g` : '—'}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
