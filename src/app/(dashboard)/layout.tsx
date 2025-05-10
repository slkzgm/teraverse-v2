// path: src/app/(dashboard)/layout.tsx
'use client'

import { AuthGuard } from '@/components/auth-guard'
import React from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4 md:p-6">{children}</main>
      </div>
    </AuthGuard>
  )
}
