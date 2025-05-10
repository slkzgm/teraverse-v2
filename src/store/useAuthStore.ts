// path: src/store/useAuthStore.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  bearerToken: string | null
  expiresAt: number | null
  hasHydrated: boolean
  setAuthData: (token: string, expiresAt: number) => void
  clearAuthData: () => void
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      bearerToken: null,
      expiresAt: null,
      hasHydrated: false,

      setAuthData: (token, expiresAt) => {
        set({ bearerToken: token, expiresAt })
      },
      clearAuthData: () => {
        set({ bearerToken: null, expiresAt: null })
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[useAuthStore] Rehydration error:', error)
        } else if (state) {
          state.setHasHydrated(true)
        }
      },
    }
  )
)
