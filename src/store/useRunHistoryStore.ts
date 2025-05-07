// path: src/store/useRunHistoryStore.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Describes a single run recap that we'll store locally.
 */
export interface RunRecapEntry {
  dungeonId: number
  dungeonName: string
  isJuiced: boolean
  enemiesDefeated: number
  timestamp: number
  /**
   * Aggregated item changes: itemId => total net gain/loss
   */
  itemChanges: Record<number, number>
}

interface RunHistoryState {
  runs: RunRecapEntry[]
  addRun: (recap: RunRecapEntry) => void
  clearRuns: () => void
}

export const useRunHistoryStore = create<RunHistoryState>()(
  persist(
    (set) => ({
      runs: [],
      addRun: (recap) => set((state) => ({ runs: [...state.runs, recap] })),

      clearRuns: () => set({ runs: [] }),
    }),
    {
      name: 'run-history-storage', // key in localStorage
    }
  )
)
