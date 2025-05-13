'use client'

import { useAlgorithmStore } from '@/store/useAlgorithmStore'
import { Brain, Crosshair, PanelTop, Hand, Sparkles, Cpu, Zap, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type AlgorithmStat = {
  speed: number
  performance: number
  consistency: number
  description: string
  recommended?: boolean
}
type AlgorithmId = 'manual' | 'mcts' | 'minimax' | 'dp' | 'greedy' | 'random'

// Define characteristics for each algorithm
const algorithmStats: Record<AlgorithmId, AlgorithmStat> = {
  manual: {
    speed: 1, // Very Slow
    performance: 2, // Low
    consistency: 2, // Variable
    description: 'Full manual control. Best for learning and experimenting.',
  },
  mcts: {
    speed: 1, // Very Slow
    performance: 3, // Average
    consistency: 3, // Average
    description: 'Monte Carlo simulations. Powerful but slow and variable due to randomness.',
  },
  minimax: {
    speed: 3, // Medium
    performance: 4, // Good
    consistency: 4, // High
    description: 'Considers best opponent moves. Balanced, reliable, and effective.',
  },
  dp: {
    speed: 3, // Fast
    performance: 4, // Average
    consistency: 5, // High
    description: 'Dynamic Programming. Fast with consistent results, ideal for quick evaluations.',
    recommended: true,
  },
  greedy: {
    speed: 5, // Very Fast
    performance: 3, // Average
    consistency: 3, // Average
    description: 'Prioritizes immediate gains. Extremely fast but limited strategic depth.',
  },
  random: {
    speed: 5, // Very Fast
    performance: 1, // Poor
    consistency: 1, // Poor
    description: 'Random selection. Fastest execution but highly unpredictable.',
  },
}

// Component to display a gauge
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

  const algorithms = [
    { id: 'manual', label: 'MANUAL', icon: Hand },
    { id: 'mcts', label: 'MCTS', icon: Brain },
    { id: 'minimax', label: 'MINIMAX', icon: Crosshair },
    { id: 'dp', label: 'DP', icon: PanelTop },
    { id: 'greedy', label: 'GREEDY', icon: BarChart3 },
    { id: 'random', label: 'RANDOM', icon: Zap },
  ] as const

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Algorithm</h2>
          <div className="text-xs text-muted-foreground">
            <span className="inline-flex items-center">
              <Cpu className="mr-1 h-3 w-3" />
              Select an algorithm
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {algorithms.map((algo) => {
            const isSelected = selectedAlgorithm === algo.id
            const stats = algorithmStats[algo.id as keyof typeof algorithmStats]
            const isRecommended = stats?.recommended

            return (
              <Tooltip key={algo.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'relative overflow-hidden rounded-md border transition-all duration-200',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5',
                      isRecommended && !isSelected && 'border-amber-500/50'
                    )}
                  >
                    {isRecommended && (
                      <div className="absolute right-0 top-0">
                        <div className="flex items-center rounded-bl-md bg-amber-500 px-1 py-0.5 text-[9px] font-medium text-amber-950">
                          <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                          BEST
                        </div>
                      </div>
                    )}

                    <div className="cursor-pointer p-2" onClick={() => setAlgorithm(algo.id)}>
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
                          value={stats?.speed || 0}
                          label="Speed"
                          color={isSelected ? 'bg-primary' : 'bg-primary/60'}
                        />
                        <StatGauge
                          value={stats?.performance || 0}
                          label="Perf"
                          color={isSelected ? 'bg-primary' : 'bg-primary/60'}
                        />
                        <StatGauge
                          value={stats?.consistency || 0}
                          label="Consist"
                          color={isSelected ? 'bg-primary' : 'bg-primary/60'}
                        />
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>{stats?.description || 'No description available.'}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
