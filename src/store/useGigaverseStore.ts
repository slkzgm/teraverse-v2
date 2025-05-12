// path: src/store/useGigaverseStore.ts
'use client'

import { create } from 'zustand'
import { DungeonData } from '@slkzgm/gigaverse-sdk'
import type { EnergyParsedData } from '@slkzgm/gigaverse-sdk/dist/client/types/responses'
import {
  getEnergyAction,
  getDungeonTodayAction,
  getUserRoms,
  claimRom,
} from '@/actions/gigaverseActions'
import type { RomEntity } from '@slkzgm/gigaverse-sdk'

type DayProgressMap = Record<number, number>

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[sleep] Done sleeping for ${ms}ms at ${new Date().toLocaleTimeString()}`)
      resolve()
    }, ms)
  })
}

interface GigaverseState {
  address: string | null
  username: string | null
  noobId: string | null
  actionToken: string | null
  dungeonState: DungeonData | null
  energyData: EnergyParsedData | null
  energyTimerId: number | null
  dayProgressMap: DayProgressMap
  romEntities: RomEntity[]

  setUserData: (address: string, username: string, noobId: string) => void
  setActionToken: (token: string | null) => void
  setDungeonState: (d: DungeonData | null) => void
  clearUserData: () => void

  loadEnergy: (token: string) => Promise<void>
  stopEnergyTimer: () => void
  scheduleBoundaryFetch: (token: string) => void

  loadDayProgress: (token: string) => Promise<void>
  incrementRunCount: (dungeonId: number, incrementValue: number) => void

  fetchUserRoms: (token: string, userAddress: string) => Promise<void>

  /**
   * Claims one resource type from all ROMs in sequence with a small delay,
   * then does a final refresh of ROMs, and if type is "energy", refresh energy as well.
   */
  claimResourceForAll: (
    token: string,
    userAddress: string,
    type: 'dust' | 'shard' | 'energy'
  ) => Promise<void>

  getTotalEnergyCollectable: () => number
  getTotalShardCollectable: () => number
  getTotalDustCollectable: () => number
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
  romEntities: [],

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
      romEntities: [],
    })
  },

  async loadEnergy(token) {
    try {
      const address = get().address
      if (!address) return
      const response = await getEnergyAction(token, address)
      const entities = Array.isArray(response.entities) ? response.entities : [response.entities]
      const first = entities[0]
      if (!first?.parsedData) return
      set({ energyData: first.parsedData })
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

  scheduleBoundaryFetch(token) {
    get().stopEnergyTimer()
    const ed = get().energyData
    if (!ed) return
    const { energy, maxEnergy, regenPerSecond } = ed
    if (energy >= maxEnergy) return

    const currentInteger = Math.floor(energy / 1_000_000_000)
    const nextBoundary = (currentInteger + 1) * 1_000_000_000
    const diff = nextBoundary - energy
    if (diff <= 0 || regenPerSecond <= 0) return

    let timeToWaitMs = (diff / regenPerSecond) * 1000
    if (timeToWaitMs < 100) {
      timeToWaitMs = 100
    }
    const timerId = window.setTimeout(() => {
      get().loadEnergy(token)
    }, timeToWaitMs)
    set({ energyTimerId: timerId })
  },

  async loadDayProgress(token) {
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

  async fetchUserRoms(token, userAddress) {
    try {
      const resp = await getUserRoms(token, userAddress)
      set({ romEntities: resp.entities })
    } catch (err) {
      console.error('[useGigaverseStore] fetchUserRoms error:', err)
    }
  },

  /**
   * Claim the specified resource type from all ROMs in sequence.
   * Adds a small delay between claims to avoid server overload and 500 errors.
   */
  async claimResourceForAll(token, userAddress, type) {
    console.log(
      `[claimResourceForAll] Start for type=${type} at ${new Date().toLocaleTimeString()}`
    )
    await get().fetchUserRoms(token, userAddress)

    let filtered = get().romEntities.filter((r) => {
      if (type === 'dust') return r.factoryStats.dustCollectable > 0
      if (type === 'shard') return r.factoryStats.shardCollectable > 0
      return r.factoryStats.energyCollectable > 0
    })

    if (type === 'dust') {
      filtered.sort((a, b) => b.factoryStats.dustCollectable - a.factoryStats.dustCollectable)
    } else if (type === 'shard') {
      filtered.sort((a, b) => b.factoryStats.shardCollectable - a.factoryStats.shardCollectable)
    } else {
      filtered.sort((a, b) => b.factoryStats.energyCollectable - a.factoryStats.energyCollectable)

      const energyData = get().energyData
      if (energyData) {
        let accumulatedEnergy = Math.floor(energyData.energy / 1_000_000_000)
        const maxEnergy = energyData.maxEnergy

        filtered = filtered.filter((rom) => {
          if (accumulatedEnergy >= maxEnergy) return false
          const energyFromRom = rom.factoryStats.energyCollectable
          if (energyFromRom <= 0) return false
          if (accumulatedEnergy + energyFromRom > maxEnergy) {
            accumulatedEnergy = maxEnergy
            return true
          }
          accumulatedEnergy += energyFromRom
          return true
        })
      }
    }

    const PER_ROM_DELAY_MS = 800

    for (let i = 0; i < filtered.length; i++) {
      const rom = filtered[i]
      console.log(
        `[claimResourceForAll] Claiming "${type}" from ROM docId=${rom.docId}, index=${i + 1}/${filtered.length} at ${new Date().toLocaleTimeString()}`
      )
      try {
        await sleep(PER_ROM_DELAY_MS)
        await claimRom(token, { romId: rom.docId, claimId: type })
      } catch (err) {
        console.error('[claimResourceForAll] claimRom error:', err)
      }
    }

    await get().fetchUserRoms(token, userAddress)
    if (type === 'energy') await get().loadEnergy(token)

    console.log(`[claimResourceForAll] DONE for type=${type} at ${new Date().toLocaleTimeString()}`)
  },

  getTotalEnergyCollectable() {
    return get().romEntities.reduce((acc, r) => acc + r.factoryStats.energyCollectable, 0)
  },
  getTotalShardCollectable() {
    return get().romEntities.reduce((acc, r) => acc + r.factoryStats.shardCollectable, 0)
  },
  getTotalDustCollectable() {
    return get().romEntities.reduce((acc, r) => acc + r.factoryStats.dustCollectable, 0)
  },
}))
