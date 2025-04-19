// path: src/store/useGigaverseStore.ts
'use client'

import { create } from 'zustand'
import { DungeonData } from '@slkzgm/gigaverse-sdk'

interface GigaverseState {
  address: string | null
  username: string | null
  noobId: string | null
  actionToken: string | number | null
  dungeonState: DungeonData | null

  setUserData: (address: string, username: string, noobId: string) => void
  setActionToken: (token: string | number) => void
  setDungeonState: (dungeonState: DungeonData | null) => void
  clearUserData: () => void
}

export const useGigaverseStore = create<GigaverseState>((set) => ({
  address: null,
  username: null,
  noobId: null,
  actionToken: null,
  dungeonState: null,

  setUserData: (address, username, noobId) => {
    console.log('[useGigaverseStore] Setting user data.')
    set({ address, username, noobId })
  },

  setActionToken: (token) => {
    console.log('[useGigaverseStore] Updating actionToken:', token)
    set({ actionToken: token })
  },

  setDungeonState: (dungeonState) => {
    console.log('[useGigaverseStore] Setting dungeon state.')
    set({ dungeonState })
  },

  clearUserData: () => {
    console.log('[useGigaverseStore] Clearing user data + actionToken + dungeonState.')
    set({
      address: null,
      username: null,
      noobId: null,
      actionToken: null,
      dungeonState: null,
    })
  },
}))
