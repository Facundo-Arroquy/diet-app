'use client'

import type { AnalysisResult, MacroStatus, PortionStatus } from '@/models'

// ─────────────────────────────────────────────────────────────
// Status badges
// ─────────────────────────────────────────────────────────────

type AnyStatus = MacroStatus | PortionStatus

const statusConfig: Record<AnyStatus, { label: string; classes: string }> = {
  cumplido:      { label: '✓ Cumplido',  classes: 'bg-green-100 text-green-800 border-green-200' },
  faltante:      { label: '↓ Faltante',  classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  exceso:        { label: '↑ Exceso',    classes: 'bg-red-100  text-red-800  border-red-200' },
  'sin-objetivo':{ label: '— Sin obj.',  classes: 'bg-gray-100 text-gray-600 border-gray-200' },
}

function StatusBadge({ status }: { status: AnyStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────

function ProgressBar({ actual, target, status }: { actual: number; target: number | null; status: AnyStatus }) {
  if (!target) return null
  const pct = Math.min((actual / target) * 100, 130)
  const colorClass =
    status === 'cumplido' ? 'bg-green-500' :
    status === 'exceso'   ? 'bg-red-500' :
    'bg-amber-400'

  return (
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        className={`h-full rounded-full transition-all ${colorClass}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
        role="progressbar"
        aria-valuenow={actual}
        aria-valuemax={target}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

interface AnalysisViewProps {
  result: AnalysisResult
  compact?: boolean
}

export function AnalysisView({ result, compact = false }: AnalysisViewProps) {
  const { totals, categories, macros } = result

  return (
    <div className="space-y-5">
      {/* Totales */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Totales
        </h3>
        <div className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-5'}`}>
          {[
            { label: 'Calorías',      value: `${totals.calorias} kcal` },
            { label: 'Proteínas',     value: `${totals.proteinas} g` },
            { label: 'Carbohidratos', value: `${totals.carbohidratos} g` },
            { label: 'Grasas',        value: `${totals.grasas} g` },
            { label: 'Fibra',         value: `${totals.fibra} g` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="mt-0.5 font-semibold text-gray-900 text-sm">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Porciones por categoría */}
      {categories.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Porciones por categoría
          </h3>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.categoryId} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900">{cat.categoryNombre}</span>
                  <StatusBadge status={cat.status} />
                </div>
                <ProgressBar actual={cat.actual} target={cat.required} status={cat.status} />
                <p className="mt-1.5 text-xs text-gray-500">
                  {cat.actual.toFixed(2)} / {cat.required} porciones
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Macros vs objetivo */}
      {macros.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Macros vs objetivo
          </h3>
          <div className="space-y-2">
            {macros.map(m => (
              <div key={m.key} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900">{m.nombre}</span>
                  <StatusBadge status={m.status} />
                </div>
                <ProgressBar actual={m.actual} target={m.target} status={m.status} />
                <p className="mt-1.5 text-xs text-gray-500">
                  {m.actual}{m.key === 'calorias' ? ' kcal' : ' g'}
                  {m.target !== null ? ` / ${m.target}${m.key === 'calorias' ? ' kcal' : ' g'}` : ' (sin objetivo)'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
