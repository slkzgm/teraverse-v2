// path: src/components/auth-guard.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { validateTokenAction } from '@/actions/gigaverseActions'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { hasHydrated, bearerToken, expiresAt } = useAuthStore()
  const { setUserData } = useGigaverseStore()
  const didValidate = useRef(false)

  useEffect(() => {
    if (!hasHydrated || didValidate.current) return
    didValidate.current = true

    if (!bearerToken || !expiresAt || Date.now() > expiresAt) {
      router.replace('/')
      return
    }

    validateTokenAction(bearerToken)
      .then((res) => {
        if (!res.success || !res.address) {
          router.replace('/')
        } else {
          setUserData(res.address, res.username ?? '', res.noobId ?? '')
        }
      })
      .catch(() => {
        router.replace('/')
      })
  }, [hasHydrated, bearerToken, expiresAt, router, setUserData])

  if (!hasHydrated) {
    return <div>Loading…</div>
  }

  return <>{children}</>
}
