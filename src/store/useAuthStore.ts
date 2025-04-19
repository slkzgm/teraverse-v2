// path: src/store/useAuthStore.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Auth store that persists bearerToken and expiresAt in localStorage.
 */
interface AuthState {
  bearerToken: string | null
  expiresAt: number | null
  setAuthData: (token: string, expiresAt: number) => void
  clearAuthData: () => void
}

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      bearerToken: null,
      expiresAt: null,

      setAuthData: (token, expiresAt) => {
        console.log('[useAuthStore] Setting bearerToken + expiresAt')
        set({ bearerToken: token, expiresAt })
      },

      clearAuthData: () => {
        console.log('[useAuthStore] Clearing bearerToken + expiresAt')
        set({ bearerToken: null, expiresAt: null })
      },
    }),
    { name: 'auth-storage' }
  )
)
