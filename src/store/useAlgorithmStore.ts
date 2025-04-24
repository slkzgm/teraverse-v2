// path: src/store/useAlgorithmStore.ts
'use client'

import { create } from 'zustand'

type AlgorithmType = 'manual' | 'mcts' | 'random' // add or remove as needed

interface AlgorithmState {
  selectedAlgorithm: AlgorithmType
  autoPlay: boolean

  setAlgorithm: (algo: AlgorithmType) => void
  setAutoPlay: (val: boolean) => void
}

export const useAlgorithmStore = create<AlgorithmState>((set) => ({
  selectedAlgorithm: 'manual',
  autoPlay: false,

  setAlgorithm: (algo) => {
    console.log('[useAlgorithmStore] Setting algorithm to:', algo)
    set({ selectedAlgorithm: algo })
  },

  setAutoPlay: (val) => {
    console.log('[useAlgorithmStore] setAutoPlay =>', val)
    set({ autoPlay: val })
  },
}))
