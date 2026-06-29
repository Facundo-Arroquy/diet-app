'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const normalItems = [
  { href: '/dashboard',  label: 'Dashboard', icon: '📊' },
  { href: '/registro',   label: 'Registrar', icon: '✍️' },
  { href: '/dieta',      label: 'Mi dieta',  icon: '🥗' },
]

const stockItems = [
  { href: '/stock',        label: 'Stock',        icon: '📦' },
  { href: '/ingredientes', label: 'Ingredientes', icon: '🥦' },
  { href: '/categorias',   label: 'Categorías',   icon: '🗂️' },
]

interface BottomNavProps {
  stockMode: boolean
  onToggleStockMode: () => void
}

export function BottomNav({ stockMode, onToggleStockMode }: BottomNavProps) {
  const pathname = usePathname()
  const items = stockMode ? stockItems : normalItems

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-gray-200 bg-white safe-area-pb"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors
              ${active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <span className="text-[22px] leading-none" aria-hidden="true">{icon}</span>
            <span className="leading-tight">{label}</span>
          </Link>
        )
      })}
      <button
        onClick={onToggleStockMode}
        aria-label={stockMode ? 'Salir del modo stock' : 'Activar modo stock'}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors
          ${stockMode ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <span className="text-[22px] leading-none" aria-hidden="true">{stockMode ? '✕' : '⚙️'}</span>
        <span className="leading-tight">{stockMode ? 'Salir' : 'Stock'}</span>
      </button>
    </nav>
  )
}
