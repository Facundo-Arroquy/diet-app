'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard',   label: 'Dashboard',    icon: '📊', stockOnly: false },
  { href: '/registro',    label: 'Registrar',    icon: '✍️', stockOnly: false },
  { href: '/dieta',       label: 'Mi dieta',     icon: '🥗', stockOnly: false },
  { href: '/stock',       label: 'Stock',        icon: '📦', stockOnly: true  },
  { href: '/ingredientes',label: 'Ingredientes', icon: '🥦', stockOnly: true  },
  { href: '/categorias',  label: 'Categorías',   icon: '🗂️', stockOnly: true  },
]

interface SidebarProps {
  stockMode: boolean
  onToggleStockMode: () => void
}

export function Sidebar({ stockMode, onToggleStockMode }: SidebarProps) {
  const pathname = usePathname()
  const { activeUser, clearUser } = useUser()
  const router = useRouter()

  const handleChangeUser = () => {
    clearUser()
    router.push('/')
  }

  const visibleItems = stockMode ? navItems.filter(i => i.stockOnly) : navItems

  return (
    <aside className="hidden md:flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="border-b border-gray-100 px-4 py-5">
        <span className="text-xl font-bold text-brand-700">🌿 DietApp</span>
      </div>

      {/* Usuario activo */}
      {activeUser && (
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Usuario</p>
          <p className="mt-0.5 font-semibold text-gray-900 truncate">{activeUser.nombre}</p>
          <button
            onClick={handleChangeUser}
            className="mt-1.5 text-xs text-brand-600 hover:text-brand-800 focus-visible:outline-brand-500"
          >
            Cambiar usuario →
          </button>
        </div>
      )}

      {/* Nav */}
      <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {visibleItems.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    focus-visible:outline-brand-500
                    ${active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  aria-current={active ? 'page' : undefined}
                >
                  <span aria-hidden="true" className="text-base">{icon}</span>
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-2">
        <button
          onClick={onToggleStockMode}
          className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
            stockMode
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {stockMode ? '📦 Modo stock — activo' : '📦 Modo stock'}
        </button>
        <p className="text-xs text-gray-400">DietApp v0.1.0</p>
      </div>
    </aside>
  )
}
