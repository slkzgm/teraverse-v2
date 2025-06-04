'use client'

import { useAlgorithmStore } from '@/store/useAlgorithmStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { useRunHistoryStore } from '@/store/useRunHistoryStore'
import {
  Brain,
  Crosshair,
  PanelTop,
  Hand,
  Sparkles,
  Cpu,
  Zap,
  BarChart3,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type AlgorithmId = 'manual' | 'mcts' | 'minimax' | 'dp' | 'greedy' | 'random'

type AlgorithmStat = {
  speed: number
  performance: number
  consistency: number
  description: string
  recommended?: boolean
}

const algorithmStats: Record<AlgorithmId, AlgorithmStat> = {
  manual: {
    speed: 1,
    performance: 2,
    consistency: 2,
    description: 'Full manual control. Best for learning and experimenting.',
  },
  mcts: {
    speed: 1,
    performance: 3,
    consistency: 3,
    description: 'Monte Carlo Tree Search. Powerful but slow and somewhat variable.',
  },
  minimax: {
    speed: 3,
    performance: 4,
    consistency: 4,
    description: 'Considers best opponent moves. Balanced and reliable.',
  },
  dp: {
    speed: 3,
    performance: 4,
    consistency: 5,
    description: 'Dynamic Programming. Fast, consistent, good for quick evaluations.',
    recommended: true,
  },
  greedy: {
    speed: 5,
    performance: 3,
    consistency: 3,
    description: 'Prioritizes immediate gains. Very fast but limited depth.',
  },
  random: {
    speed: 5,
    performance: 1,
    consistency: 1,
    description: 'Random selection. Fast but highly unpredictable.',
  },
}

function StatGauge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-14 text-xs text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 20}%` }} />
      </div>
    </div>
  )
}

export function AlgorithmSelector() {
  const { selectedAlgorithm, setAlgorithm } = useAlgorithmStore()
  const { dungeonState } = useGigaverseStore()
  const { runs } = useRunHistoryStore()

  // Identify current dungeon ID, if any
  const currentDungeonId = dungeonState?.entity?.ID_CID ? Number(dungeonState.entity.ID_CID) : null

  const algorithms = [
    { id: 'manual', label: 'MANUAL', icon: Hand },
    { id: 'mcts', label: 'MCTS', icon: Brain },
    { id: 'minimax', label: 'MINIMAX', icon: Crosshair },
    { id: 'dp', label: 'DP', icon: PanelTop },
    { id: 'greedy', label: 'GREEDY', icon: BarChart3 },
    { id: 'random', label: 'RANDOM', icon: Zap },
  ] as const

  // Compute average defeated for each algo in the current dungeon
  const computedAlgos = algorithms.map((algo) => {
    let averageDefeated = 0
    let displayLabel = 'Avg: N/A'

    if (currentDungeonId !== null) {
      const relevantRuns = runs.filter(
        (r) => r.dungeonId === currentDungeonId && r.algorithmUsed === algo.id
      )
      if (relevantRuns.length > 0) {
        const totalDefeated = relevantRuns.reduce((sum, run) => sum + run.enemiesDefeated, 0)
        averageDefeated = totalDefeated / relevantRuns.length
        displayLabel = `Avg: ${averageDefeated.toFixed(1)}`
      }
    }

    return {
      ...algo,
      averageDefeated,
      averageLabel: displayLabel,
    }
  })

  // Determine which algo is best based on user performance
  const bestAverage = Math.max(...computedAlgos.map((a) => a.averageDefeated))
  let bestAlgoId: AlgorithmId | null = null

  if (bestAverage > 0) {
    // pick the first that has the bestAverage
    const bestEntry = computedAlgos.find((a) => a.averageDefeated === bestAverage)
    bestAlgoId = bestEntry ? bestEntry.id : null
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Algorithm</h2>
          <div className="inline-flex items-center text-xs text-muted-foreground">
            <Cpu className="mr-1 h-3 w-3" />
            Select an algorithm
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {algorithms.map((algo) => {
            const isSelected = selectedAlgorithm === algo.id
            const stats = algorithmStats[algo.id]
            const isRecommended = stats?.recommended
            const isBest = bestAlgoId === algo.id

            // Compute average for the current dungeon + this algo
            let averageDefeatedStr = ''
            if (currentDungeonId !== null) {
              const relevantRuns = runs.filter(
                (r) => r.dungeonId === currentDungeonId && r.algorithmUsed === algo.id
              )
              if (relevantRuns.length > 0) {
                const totalDefeated = relevantRuns.reduce(
                  (sum, run) => sum + run.enemiesDefeated,
                  0
                )
                const avg = totalDefeated / relevantRuns.length
                averageDefeatedStr = `Avg: ${avg.toFixed(1)}`
              } else {
                averageDefeatedStr = 'Avg: N/A'
              }
            }

            return (
              <Tooltip key={algo.id}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => setAlgorithm(algo.id)}
                    className={cn(
                      'relative cursor-pointer overflow-hidden rounded-md border transition-all duration-200',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5',
                      isBest && !isSelected && 'border-amber-500/50',
                      isRecommended && !isBest && !isSelected && 'border-blue-500/50'
                    )}
                  >
                    {/* Show average in the top-right corner */}
                    {currentDungeonId !== null && (
                      <div className="absolute right-1 top-1 z-10 rounded bg-muted/70 px-1 text-[10px] font-semibold text-muted-foreground/90">
                        {averageDefeatedStr}
                      </div>
                    )}

                    {/* "BEST" label for user's best performing algorithm */}
                    {isBest && (
                      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 transform">
                        <div className="flex items-center rounded-b-md bg-amber-500 px-1 py-0.5 text-[9px] font-medium text-amber-950">
                          <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                          BEST
                        </div>
                      </div>
                    )}

                    {/* "RECOMMENDED" label for theoretically recommended algorithm */}
                    {isRecommended && !isBest && (
                      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 transform">
                        <div className="flex items-center rounded-b-md bg-blue-500 px-1 py-0.5 text-[9px] font-medium text-blue-50">
                          <Award className="mr-0.5 h-2.5 w-2.5" />
                          RECOMMENDED
                        </div>
                      </div>
                    )}

                    <div className="p-2">
                      <div className="mb-1.5 flex items-center">
                        <algo.icon
                          className={cn(
                            'mr-1.5 h-4 w-4',
                            isSelected ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                        <h3 className={cn('text-sm font-medium', isSelected ? 'text-primary' : '')}>
                          {algo.label}
                        </h3>
                      </div>

                      <div className="space-y-1">
                        <StatGauge
                          value={stats.speed}
                          label="Speed"
                          color={isSelected ? 'bg-primary' : 'bg-primary/60'}
                        />
                        <StatGauge
                          value={stats.performance}
                          label="Perf"
                          color={isSelected ? 'bg-primary' : 'bg-primary/60'}
                        />
                        <StatGauge
                          value={stats.consistency}
                          label="Consist"
                          color={isSelected ? 'bg-primary' : 'bg-primary/60'}
                        />
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>{stats?.description || 'No description available.'}</p>
                  {isBest && (
                    <p className="mt-1 text-xs text-amber-600">
                      🏆 Your best performing algorithm for this dungeon!
                    </p>
                  )}
                  {isRecommended && !isBest && (
                    <p className="mt-1 text-xs text-blue-600">
                      💡 Theoretically recommended based on stats.
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
