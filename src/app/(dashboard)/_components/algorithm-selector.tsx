// path: src/app/dashboard/components/algorithm-selector.tsx
'use client'
import { useAlgorithmStore } from '@/store/useAlgorithmStore'
import { Button } from '@/components/ui/button'
import { Brain, Dices, Hand } from 'lucide-react'

/**
 * A component that allows picking an algorithm (manual, mcts, random)
 * and toggling auto-play.
 */
export default function AlgorithmSelector() {
  const { selectedAlgorithm, setAlgorithm } = useAlgorithmStore()

  const algorithms = [
    { id: 'manual', label: 'MANUAL', icon: Hand },
    { id: 'mcts', label: 'MCTS', icon: Brain },
    { id: 'random', label: 'RANDOM', icon: Dices },
  ] as const

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">Algorithm</h2>
      <div className="flex flex-wrap gap-2">
        {algorithms.map((algo) => {
          const isSelected = selectedAlgorithm === algo.id
          return (
            <Button
              key={algo.id}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAlgorithm(algo.id)}
              className="flex-1"
            >
              <algo.icon className="mr-2 h-4 w-4" />
              {algo.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
