// path: src/store/useGigaverseStore.ts
'use client'

import { create } from 'zustand'
import { DungeonData } from '@slkzgm/gigaverse-sdk'
import type { EnergyParsedData } from '@slkzgm/gigaverse-sdk/dist/client/types/responses'
import { getEnergyAction, getDungeonTodayAction } from '@/actions/gigaverseActions'

type DayProgressMap = Record<number, number>

interface GigaverseState {
  address: string | null
  username: string | null
  noobId: string | null
  actionToken: string | null
  dungeonState: DungeonData | null

  energyData: EnergyParsedData | null
  energyTimerId: number | null

  dayProgressMap: DayProgressMap

  setUserData: (address: string, username: string, noobId: string) => void
  setActionToken: (token: string | null) => void
  setDungeonState: (d: DungeonData | null) => void
  clearUserData: () => void

  loadEnergy: (token: string) => Promise<void>
  stopEnergyTimer: () => void
  scheduleBoundaryFetch: (token: string) => void

  loadDayProgress: (token: string) => Promise<void>

  incrementRunCount: (dungeonId: number, incrementValue: number) => void
}

export const useGigaverseStore = create<GigaverseState>((set, get) => ({
  address: null,
  username: null,
  noobId: null,
  actionToken: null,
  dungeonState: null,

  energyData: null,
  energyTimerId: null,

  dayProgressMap: {},

  setUserData: (address, username, noobId) => {
    set({ address, username, noobId })
  },

  setActionToken: (token) => {
    set({ actionToken: token })
  },

  setDungeonState: (dungeonState) => {
    set({ dungeonState })
  },

  clearUserData: () => {
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

  async loadEnergy(token: string) {
    try {
      const address = get().address
      if (!address) {
        return
      }
      const response = await getEnergyAction(token, address)
      const entities = Array.isArray(response.entities) ? response.entities : [response.entities]
      const firstEntity = entities[0]
      if (!firstEntity?.parsedData) {
        return
      }
      set({ energyData: firstEntity.parsedData })
      get().scheduleBoundaryFetch(token)
    } catch (err) {
      console.error('[useGigaverseStore] loadEnergy error:', err)
    }
  },

  stopEnergyTimer() {
    const currentTimer = get().energyTimerId
    if (currentTimer) {
      clearTimeout(currentTimer)
      set({ energyTimerId: null })
    }
  },

  scheduleBoundaryFetch(token: string) {
    get().stopEnergyTimer()

    const ed = get().energyData
    if (!ed) {
      return
    }
    const { energy, maxEnergy, regenPerSecond } = ed
    if (energy >= maxEnergy) {
      return
    }

    const currentInteger = Math.floor(energy / 1_000_000_000)
    const nextBoundary = (currentInteger + 1) * 1_000_000_000
    const diff = nextBoundary - energy
    if (diff <= 0 || regenPerSecond <= 0) {
      return
    }
    let timeToWaitMs = (diff / regenPerSecond) * 1000
    if (timeToWaitMs < 100) {
      timeToWaitMs = 100
    }

    const timerId = window.setTimeout(() => {
      get().loadEnergy(token)
    }, timeToWaitMs)

    set({ energyTimerId: timerId })
  },

  async loadDayProgress(token: string) {
    try {
      const resp = await getDungeonTodayAction(token)
      const map: DayProgressMap = {}
      resp.dayProgressEntities.forEach((entry) => {
        const dungeonId = parseInt(entry.ID_CID, 10)
        map[dungeonId] = entry.UINT256_CID
      })
      set({ dayProgressMap: map })
    } catch (err) {
      console.error('[useGigaverseStore] loadDayProgress error:', err)
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
