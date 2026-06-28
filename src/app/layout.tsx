import type { Metadata } from 'next'
import './globals.css'
import { UserProvider } from '@/hooks/useUser'

export const metadata: Metadata = {
  title: 'Diet App — Gestión de dieta',
  description: 'Registrá comidas y verificá el cumplimiento de tu dieta personalizada',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
