// path: src/app/(dashboard)/_components/run-stats-content.tsx
'use client'

import React, { useMemo } from 'react'
import { BarChart4, ListChecks } from 'lucide-react'
import { RunRecapEntry } from '@/store/useRunHistoryStore'

interface RunStatsContentProps {
  runs: RunRecapEntry[]
}

export function RunStatsContent({ runs }: RunStatsContentProps) {
  // Build aggregated stats by dungeon (always call useMemo)
  const dungeonStats = useMemo(() => {
    const statsMap: Record<
      number,
      {
        dungeonId: number
        dungeonName: string
        totalRuns: number
        totalDefeated: number
        byAlgorithm: Record<string, { runs: number; totalDefeated: number }>
      }
    > = {}

    for (const run of runs) {
      if (!statsMap[run.dungeonId]) {
        statsMap[run.dungeonId] = {
          dungeonId: run.dungeonId,
          dungeonName: run.dungeonName,
          totalRuns: 0,
          totalDefeated: 0,
          byAlgorithm: {},
        }
      }
      const ds = statsMap[run.dungeonId]
      ds.totalRuns++
      ds.totalDefeated += run.enemiesDefeated

      if (!ds.byAlgorithm[run.algorithmUsed]) {
        ds.byAlgorithm[run.algorithmUsed] = {
          runs: 0,
          totalDefeated: 0,
        }
      }
      ds.byAlgorithm[run.algorithmUsed].runs++
      ds.byAlgorithm[run.algorithmUsed].totalDefeated += run.enemiesDefeated
    }

    return Object.values(statsMap).sort((a, b) => a.dungeonId - b.dungeonId)
  }, [runs])

  if (!runs.length) {
    return <p className="text-muted-foreground">No runs recorded yet.</p>
  }

  return (
    <div className="space-y-3">
      <div className="mb-3 flex items-center">
        <BarChart4 className="mr-2 h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Run Statistics</h2>
      </div>

      <div className="max-h-[400px] space-y-4 overflow-y-auto pr-1">
        {dungeonStats.map((ds) => {
          // Overall average for the dungeon
          const avgDefeated = ds.totalRuns > 0 ? (ds.totalDefeated / ds.totalRuns).toFixed(1) : '0'

          // Convert ds.byAlgorithm into an array so we can sort
          const algoStatsArray = Object.entries(ds.byAlgorithm)
            .map(([algo, algoData]) => {
              const subAvg = algoData.runs > 0 ? algoData.totalDefeated / algoData.runs : 0
              return {
                algo,
                runs: algoData.runs,
                totalDefeated: algoData.totalDefeated,
                subAvg,
              }
            })
            // Sort in descending order by subAvg
            .sort((a, b) => b.subAvg - a.subAvg)

          return (
            <div key={ds.dungeonId} className="rounded-md border border-border bg-background p-3">
              {/* Dungeon info */}
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

              {/* Breakdown by algorithm, sorted */}
              <div className="rounded bg-muted/10 p-2 text-xs">
                <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                  <ListChecks className="h-3 w-3" />
                  <span className="font-semibold">By Algorithm (desc)</span>
                </div>
                {algoStatsArray.map((entry) => (
                  <div
                    key={entry.algo}
                    className="flex items-center justify-between rounded px-1 py-0.5 hover:bg-muted/20"
                  >
                    <span>{entry.algo.toUpperCase()}:</span>
                    <span>
                      <span className="font-medium">
                        {entry.runs} run{entry.runs > 1 ? 's' : ''}
                      </span>
                      {' - Avg Defeated: '}
                      <span className="font-medium">{entry.subAvg.toFixed(1)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
