// path: src/app/dashboard/layout.tsx

import type React from 'react'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
