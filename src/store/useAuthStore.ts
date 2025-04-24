// path: src/store/useAuthStore.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  bearerToken: string | null
  expiresAt: number | null
  setAuthData: (token: string, expiresAt: number) => void
  clearAuthData: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      bearerToken: null,
      expiresAt: null,

      setAuthData: (token, expiresAt) => {
        set({ bearerToken: token, expiresAt })
      },
      clearAuthData: () => {
        set({ bearerToken: null, expiresAt: null })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
