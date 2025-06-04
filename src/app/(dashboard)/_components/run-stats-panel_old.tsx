// path: src/app/(dashboard)/_components/run-stats-panel_old.tsx

'use client'

import React, { useMemo } from 'react'
import { useRunHistoryStore } from '@/store/useRunHistoryStore'
import { BarChart4, ListChecks } from 'lucide-react'

/**
 * Displays summarized statistics based on run history.
 * For each dungeon, shows the total runs, average defeated enemies,
 * and also breaks down average defeated enemies by algorithm used.
 */
export function RunStatsPanel() {
  const { runs } = useRunHistoryStore()

  // Compute aggregated statistics
  const dungeonStats = useMemo(() => {
    const statsMap: Record<
      number,
      {
        dungeonId: number
        dungeonName: string
        totalRuns: number
        totalDefeated: number
        byAlgorithm: Record<
          string,
          {
            runs: number
            totalDefeated: number
          }
        >
      }
    > = {}

    runs.forEach((run) => {
      if (!statsMap[run.dungeonId]) {
        statsMap[run.dungeonId] = {
          dungeonId: run.dungeonId,
          dungeonName: run.dungeonName,
          totalRuns: 0,
          totalDefeated: 0,
          byAlgorithm: {},
        }
      }
      const dungeonEntry = statsMap[run.dungeonId]
      dungeonEntry.totalRuns += 1
      dungeonEntry.totalDefeated += run.enemiesDefeated

      if (!dungeonEntry.byAlgorithm[run.algorithmUsed]) {
        dungeonEntry.byAlgorithm[run.algorithmUsed] = {
          runs: 0,
          totalDefeated: 0,
        }
      }
      dungeonEntry.byAlgorithm[run.algorithmUsed].runs += 1
      dungeonEntry.byAlgorithm[run.algorithmUsed].totalDefeated += run.enemiesDefeated
    })

    return Object.values(statsMap).sort((a, b) => a.dungeonId - b.dungeonId)
  }, [runs])

  if (!dungeonStats.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <BarChart4 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Run Statistics</h2>
        </div>
        <p className="text-muted-foreground">No runs recorded yet. Go complete some runs!</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <BarChart4 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Run Statistics</h2>
      </div>

      <div className="space-y-4">
        {dungeonStats.map((ds) => {
          const avgDefeated = ds.totalRuns > 0 ? (ds.totalDefeated / ds.totalRuns).toFixed(1) : '0'
          return (
            <div key={ds.dungeonId} className="rounded-md border border-border bg-background p-3">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {ds.dungeonName || `Dungeon #${ds.dungeonId}`}
                </h3>
                <span className="text-xs text-muted-foreground">ID: {ds.dungeonId}</span>
              </div>
              <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Runs:</span>{' '}
                  <span className="font-medium">{ds.totalRuns}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg. Defeated:</span>{' '}
                  <span className="font-medium">{avgDefeated}</span>
                </div>
              </div>

              <div className="rounded bg-muted/10 p-2 text-xs">
                <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                  <ListChecks className="h-3 w-3" />
                  <span className="font-semibold">By Algorithm</span>
                </div>
                {Object.entries(ds.byAlgorithm).map(([algo, algoStats]) => {
                  const avgAlgoDefeated =
                    algoStats.runs > 0 ? (algoStats.totalDefeated / algoStats.runs).toFixed(1) : '0'
                  return (
                    <div
                      key={algo}
                      className="flex items-center justify-between rounded px-1 py-0.5 hover:bg-muted/20"
                    >
                      <span>{algo.toUpperCase()}:</span>
                      <span>
                        <span className="font-medium">
                          {algoStats.runs} run{algoStats.runs > 1 ? 's' : ''}
                        </span>
                        {' - Avg Defeated: '}
                        <span className="font-medium">{avgAlgoDefeated}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
