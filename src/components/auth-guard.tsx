// path: src/components/auth-guard.tsx
'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { validateTokenAction } from '@/actions/gigaverseActions'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { hasHydrated, bearerToken, expiresAt } = useAuthStore()
  const { setUserData } = useGigaverseStore()
  const didValidate = useRef(false)

  const checkAuth = useCallback(async () => {
    if (!bearerToken || !expiresAt || Date.now() > expiresAt) {
      router.replace('/')
      return false
    }
    try {
      const res = await validateTokenAction(bearerToken)
      if (!res.success || !res.address) {
        router.replace('/')
        return false
      } else {
        setUserData(res.address, res.username ?? '', res.noobId ?? '')
        return true
      }
    } catch (error) {
      console.error('[AuthGuard] Token validation error:', error)
      router.replace('/')
      return false
    }
  }, [bearerToken, expiresAt, router, setUserData])

  useEffect(() => {
    if (!hasHydrated || didValidate.current) return
    didValidate.current = true
    checkAuth()
  }, [hasHydrated, checkAuth])

  useEffect(() => {
    if (!hasHydrated) return
    if (didValidate.current) {
      checkAuth()
    }
  }, [bearerToken, expiresAt, hasHydrated, checkAuth])

  if (!hasHydrated) {
    return <div>Loading…</div>
  }

  return <>{children}</>
}
