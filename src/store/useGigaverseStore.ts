// path: src/store/useGigaverseStore.ts
'use client'

import { create } from 'zustand'
import { DungeonData } from '@slkzgm/gigaverse-sdk'
import type { EnergyParsedData } from '@slkzgm/gigaverse-sdk/dist/client/types/responses'
import { getEnergyAction } from '@/actions/gigaverseActions'

interface GigaverseState {
  // User & dungeon
  address: string | null
  username: string | null
  noobId: string | null
  actionToken: string | number | null
  dungeonState: DungeonData | null

  // Energy data (in 1e9)
  energyData: EnergyParsedData | null
  energyTimerId: number | null

  // Basic setters
  setUserData: (address: string, username: string, noobId: string) => void
  setActionToken: (token: string | number) => void
  setDungeonState: (d: DungeonData | null) => void
  clearUserData: () => void

  // Main energy logic
  loadEnergy: (token: string) => Promise<void>
  stopEnergyTimer: () => void
  scheduleBoundaryFetch: (token: string) => void
}

export const useGigaverseStore = create<GigaverseState>((set, get) => ({
  // ------------------------------------------------
  // Initial state
  // ------------------------------------------------
  address: null,
  username: null,
  noobId: null,
  actionToken: null,
  dungeonState: null,

  energyData: null,
  energyTimerId: null,

  // ------------------------------------------------
  // Auth / user
  // ------------------------------------------------
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
    console.log('[useGigaverseStore] Clearing user data + dungeon + energy.')
    set({
      address: null,
      username: null,
      noobId: null,
      actionToken: null,
      dungeonState: null,
      energyData: null,
      energyTimerId: null,
    })
  },

  // ------------------------------------------------
  // Energy logic
  // ------------------------------------------------
  async loadEnergy(token) {
    console.log('[useGigaverseStore] loadEnergy => calling getEnergyAction...')
    try {
      const address = get().address
      if (!address) {
        console.warn('[useGigaverseStore] No address, skipping getEnergy')
        return
      }

      // 1) Fetch from server
      const response = await getEnergyAction(token, address)
      console.log('[useGigaverseStore] getEnergyAction response:', response)

      const e = response.entities?.[0]
      if (!e?.parsedData) {
        throw new Error(response.message || 'Failed to fetch energy.')
      }
      // 2) Store the entire object
      set({ energyData: e.parsedData })

      // 3) Now that we have an updated "energy", schedule next boundary
      get().scheduleBoundaryFetch(token)
    } catch (err) {
      console.error('[useGigaverseStore] loadEnergy error =>', err)
    }
  },

  stopEnergyTimer() {
    console.log('[useGigaverseStore] stopEnergyTimer => clearing setTimeout if any.')
    const currentTimer = get().energyTimerId
    if (currentTimer) {
      clearTimeout(currentTimer)
      set({ energyTimerId: null })
    }
  },

  /**
   * scheduleBoundaryFetch: sets a timer to call loadEnergy(...) right when the next integer boundary in 1e9 is reached.
   * For example, if "energy"=351102777524, the next boundary is 352000000000 => the difference is ~897222476
   * We'll compute how many seconds until that boundary, then do a setTimeout that calls loadEnergy again.
   * (So we re-fetch from the server exactly when the displayed energyValue should increment by +1).
   */
  scheduleBoundaryFetch(token) {
    console.log('[useGigaverseStore] scheduleBoundaryFetch called.')
    // First, clear any old timer
    get().stopEnergyTimer()

    const ed = get().energyData
    if (!ed) {
      console.log('[useGigaverseStore] No energyData => cannot schedule.')
      return
    }

    const { energy, maxEnergy, regenPerSecond } = ed
    if (energy >= maxEnergy) {
      console.log('[useGigaverseStore] Already at max => no scheduling needed.')
      return
    }

    // 1) Compute current integer boundary
    // if energy=351102777524 => floor(energy/1e9)=351 => next boundary => (351+1)*1e9=352000000000
    const currentInteger = Math.floor(energy / 1_000_000_000)
    const nextBoundary = (currentInteger + 1) * 1_000_000_000

    const diff = nextBoundary - energy
    if (diff <= 0) {
      // means we are already at or above next boundary
      console.warn('[useGigaverseStore] next boundary is <=0, skipping timer.')
      return
    }

    if (regenPerSecond <= 0) {
      console.warn('[useGigaverseStore] regenPerSecond=0 => skipping boundary fetch.')
      return
    }

    // 2) time to wait in seconds
    const timeToWaitSec = diff / regenPerSecond
    // clamp if needed
    let timeToWaitMs = timeToWaitSec * 1000
    if (timeToWaitMs < 100) {
      timeToWaitMs = 100
    }

    console.log(
      `[useGigaverseStore] scheduleBoundaryFetch => currentEnergy=${energy}, next=${nextBoundary}, diff=${diff}, regen=${regenPerSecond}, timeToWait=${timeToWaitMs}ms`
    )

    // 3) setTimeout => calls loadEnergy again at that boundary
    const timerId = window.setTimeout(() => {
      console.log('[useGigaverseStore] boundary reached => calling loadEnergy for fresh data.')
      get().loadEnergy(token)
    }, timeToWaitMs)

    set({ energyTimerId: timerId })
  },
}))
