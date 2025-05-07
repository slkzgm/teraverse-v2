// path: src/store/useGigaverseStore.ts
'use client'

import { create } from 'zustand'
import { DungeonData } from '@slkzgm/gigaverse-sdk'
import type { EnergyParsedData } from '@slkzgm/gigaverse-sdk/dist/client/types/responses'
import { getEnergyAction, getDungeonTodayAction } from '@/actions/gigaverseActions'

/**
 * Simple structure for mapping: dungeonId => daily runs used.
 * E.g. { 1: 2, 2: 5, ... }
 */
type DayProgressMap = Record<number, number>

interface GigaverseState {
  // ------------------------------------------------------------------
  // Core user/dungeon data
  // ------------------------------------------------------------------
  address: string | null
  username: string | null
  noobId: string | null
  actionToken: string | number | null
  dungeonState: DungeonData | null

  // ------------------------------------------------------------------
  // Energy data & scheduling
  // ------------------------------------------------------------------
  energyData: EnergyParsedData | null
  energyTimerId: number | null

  // ------------------------------------------------------------------
  // Day progress: how many runs used for each dungeon, reset daily
  // ------------------------------------------------------------------
  dayProgressMap: DayProgressMap

  // ------------------------------------------------------------------
  // Methods: auth, day progress, dungeon, etc.
  // ------------------------------------------------------------------
  setUserData: (address: string, username: string, noobId: string) => void
  setActionToken: (token: string | number) => void
  setDungeonState: (d: DungeonData | null) => void
  clearUserData: () => void

  loadEnergy: (token: string) => Promise<void>
  stopEnergyTimer: () => void
  scheduleBoundaryFetch: (token: string) => void

  loadDayProgress: (token: string) => Promise<void>

  incrementRunCount: (dungeonId: number, incrementValue: number) => void
}

export const useGigaverseStore = create<GigaverseState>((set, get) => ({
  // ------------------------------------------------------------------
  // Initial state
  // ------------------------------------------------------------------
  address: null,
  username: null,
  noobId: null,
  actionToken: null,
  dungeonState: null,

  energyData: null,
  energyTimerId: null,

  dayProgressMap: {},

  // ------------------------------------------------------------------
  // Basic setters
  // ------------------------------------------------------------------
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
    console.log('[useGigaverseStore] Clearing user data + dungeon + energy + dayProgress.')
    set({
      address: null,
      username: null,
      noobId: null,
      actionToken: null,
      dungeonState: null,
      energyData: null,
      energyTimerId: null,
      dayProgressMap: {},
    })
  },

  // ------------------------------------------------------------------
  // Energy logic
  // ------------------------------------------------------------------
  async loadEnergy(token) {
    console.log('[useGigaverseStore] loadEnergy => calling getEnergyAction...')
    try {
      const address = get().address
      if (!address) {
        console.warn('[useGigaverseStore] No address, skipping getEnergy')
        return
      }

      const response = await getEnergyAction(token, address)
      console.log('[useGigaverseStore] getEnergyAction response:', response)

      const e = response.entities?.[0]
      if (!e?.parsedData) {
        throw new Error(response.message || 'Failed to fetch energy.')
      }
      set({ energyData: e.parsedData })

      // schedule next boundary
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

  scheduleBoundaryFetch(token) {
    console.log('[useGigaverseStore] scheduleBoundaryFetch called.')
    get().stopEnergyTimer()

    const ed = get().energyData
    if (!ed) {
      console.log('[useGigaverseStore] No energyData => cannot schedule boundary.')
      return
    }

    const { energy, maxEnergy, regenPerSecond } = ed
    if (energy >= maxEnergy) {
      console.log('[useGigaverseStore] Already at max => no scheduling needed.')
      return
    }

    const currentInteger = Math.floor(energy / 1_000_000_000)
    const nextBoundary = (currentInteger + 1) * 1_000_000_000
    const diff = nextBoundary - energy
    if (diff <= 0) {
      console.warn('[useGigaverseStore] next boundary <=0, skipping timer.')
      return
    }
    if (regenPerSecond <= 0) {
      console.warn('[useGigaverseStore] regenPerSecond=0 => skipping boundary fetch.')
      return
    }

    const timeToWaitSec = diff / regenPerSecond
    let timeToWaitMs = timeToWaitSec * 1000
    if (timeToWaitMs < 100) {
      timeToWaitMs = 100
    }

    console.log(
      `[useGigaverseStore] scheduleBoundaryFetch => currentEnergy=${energy}, next=${nextBoundary}, diff=${diff}, regen=${regenPerSecond}, timeToWait=${timeToWaitMs}ms`
    )

    const timerId = window.setTimeout(() => {
      console.log('[useGigaverseStore] boundary reached => calling loadEnergy for fresh data.')
      get().loadEnergy(token)
    }, timeToWaitMs)

    set({ energyTimerId: timerId })
  },

  // ------------------------------------------------------------------
  // DayProgress logic
  // ------------------------------------------------------------------
  async loadDayProgress(token) {
    console.log('[useGigaverseStore] loadDayProgress => calling getDungeonTodayAction...')
    try {
      const resp = await getDungeonTodayAction(token)

      const map: DayProgressMap = {}
      resp.dayProgressEntities.forEach((entry) => {
        const dungeonId = parseInt(entry.ID_CID, 10)
        map[dungeonId] = entry.UINT256_CID
      })

      // Overwrite the entire dayProgressMap with fresh data
      set({ dayProgressMap: map })
    } catch (err) {
      console.error('[useGigaverseStore] loadDayProgress error =>', err)
    }
  },

  incrementRunCount(dungeonId, incrementValue) {
    set((state) => {
      const newMap = { ...state.dayProgressMap }
      newMap[dungeonId] = (newMap[dungeonId] || 0) + incrementValue
      return { dayProgressMap: newMap }
    })
  },
}))
