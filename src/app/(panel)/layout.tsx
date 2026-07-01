'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Sidebar } from '@/components/Sidebar'
import { BottomNav } from '@/components/BottomNav'

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { activeUser } = useUser()
  const router = useRouter()
  const [stockMode, setStockMode] = useState(true)

  useEffect(() => {
    if (activeUser === null) {
      router.replace('/')
    }
  }, [activeUser, router])

  if (!activeUser) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar stockMode={stockMode} onToggleStockMode={() => setStockMode(v => !v)} />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
          {children}
        </div>
      </main>
      <BottomNav stockMode={stockMode} onToggleStockMode={() => setStockMode(v => !v)} />
    </div>
  )
}
