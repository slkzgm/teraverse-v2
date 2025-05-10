import type React from 'react'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4 md:p-6">{children}</main>
      </div>
    </AuthGuard>
  )
}
