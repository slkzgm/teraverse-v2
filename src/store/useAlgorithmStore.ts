// path: src/store/useAlgorithmStore.ts
'use client'

import { create } from 'zustand'

type AlgorithmType = 'manual' | 'mcts' | 'random'

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
    set({ selectedAlgorithm: algo })
  },

  setAutoPlay: (val) => {
    set({ autoPlay: val })
  },
}))
