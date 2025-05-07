// path: src/app/dashboard/components/algorithm-selector.tsx
'use client'

import React from 'react'
import { useAlgorithmStore } from '@/store/useAlgorithmStore'
import { Button } from '@/components/ui/button'

/**
 * A simple component that allows picking an algorithm (manual, mcts, random)
 * and toggling auto-play.
 */
export default function AlgorithmSelector() {
  const { selectedAlgorithm, setAlgorithm } = useAlgorithmStore()

  const algorithms = ['manual', 'mcts', 'random'] as const

  return (
    <div style={{ marginBottom: 20 }}>
      <h2>Select Algorithm</h2>
      <div style={{ display: 'flex', gap: 10 }}>
        {algorithms.map((algo) => (
          <Button
            key={algo}
            variant={selectedAlgorithm === algo ? 'default' : 'outline'}
            onClick={() => setAlgorithm(algo)}
          >
            {algo.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  )
}
