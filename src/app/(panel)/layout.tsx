'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Sidebar } from '@/components/Sidebar'

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { activeUser } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (activeUser === null) {
      router.replace('/')
    }
  }, [activeUser, router])

  if (!activeUser) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
