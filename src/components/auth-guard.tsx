// path: src/components/auth-guard.tsx
'use client'

import type React from 'react'
import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { validateTokenAction } from '@/actions/gigaverseActions'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { hasHydrated, bearerToken, expiresAt } = useAuthStore()
  const { setUserData } = useGigaverseStore()
  const didValidate = useRef(false)

  // Cette fonction vérifie si l'utilisateur est authentifié
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

  // Effet initial pour vérifier l'authentification au chargement
  useEffect(() => {
    if (!hasHydrated || didValidate.current) return
    didValidate.current = true

    checkAuth()
  }, [hasHydrated, checkAuth]) // Ajout de checkAuth comme dépendance

  // Effet pour surveiller les changements dans les données d'authentification
  useEffect(() => {
    if (!hasHydrated) return

    // Si nous avons déjà validé et que les données d'authentification changent, vérifier à nouveau
    if (didValidate.current) {
      checkAuth()
    }
  }, [bearerToken, expiresAt, hasHydrated, checkAuth]) // Ajout de checkAuth comme dépendance

  if (!hasHydrated) {
    return <div>Loading…</div>
  }

  return <>{children}</>
}
