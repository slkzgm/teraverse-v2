// src/components/auth-guard.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { hasHydrated, bearerToken, expiresAt } = useAuthStore()

  React.useEffect(() => {
    if (!hasHydrated) return

    if (!bearerToken || (expiresAt && Date.now() > expiresAt)) {
      console.log('[AuthGuard] Invalid or expired token => redirecting to homepage')
      router.push('/')
    }
  }, [hasHydrated, bearerToken, expiresAt, router])

  if (!hasHydrated) {
    return <div>Loading...</div>
  }

  return <>{children}</>
}
