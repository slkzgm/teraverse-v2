// path: src/store/useRunHistoryStore.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RunRecapEntry {
  address: string
  username: string
  noobId: string
  dungeonId: number
  dungeonName: string
  isJuiced: boolean
  enemiesDefeated: number
  timestamp: number
  itemChanges: Record<number, number>
  algorithmUsed: 'manual' | 'mcts' | 'minimax' | 'dp' | 'greedy' | 'random'
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
      name: 'run-history-storage',
    }
  )
)
