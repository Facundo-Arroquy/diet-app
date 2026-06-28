'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '@/models'

interface UserContextValue {
  activeUser: User | null
  setActiveUser: (user: User | null) => void
  clearUser: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

const STORAGE_KEY = 'diet_active_user'

export function UserProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUserState] = useState<User | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (
          parsed &&
          typeof parsed === 'object' &&
          'id' in parsed &&
          'nombre' in parsed
        ) {
          setActiveUserState(parsed as User)
        }
      }
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  const setActiveUser = useCallback((user: User | null) => {
    setActiveUserState(user)
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const clearUser = useCallback(() => setActiveUser(null), [setActiveUser])

  if (!hydrated) return null

  return (
    <UserContext.Provider value={{ activeUser, setActiveUser, clearUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser debe usarse dentro de <UserProvider>')
  return ctx
}
