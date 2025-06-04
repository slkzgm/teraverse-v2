// path: src/app/(dashboard)/_components/run-history-content.tsx
'use client'

import React from 'react'
import { Flame, History } from 'lucide-react'
import { RunRecapEntry } from '@/store/useRunHistoryStore'

interface RunHistoryContentProps {
  runs: RunRecapEntry[]
}

export function RunHistoryContent({ runs }: RunHistoryContentProps) {
  if (!runs.length) {
    return <p className="text-muted-foreground">No run history available.</p>
  }

  // Sort by timestamp descending
  const sorted = [...runs].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="space-y-3">
      <div className="mb-3 flex items-center">
        <History className="mr-2 h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Run History</h2>
      </div>

      <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
        {sorted.map((run, idx) => (
          <div key={idx} className="rounded-md border border-border bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">
                {run.dungeonName}
                {run.isJuiced && (
                  <span className="ml-2 inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-500">
                    <Flame className="mr-1 h-3 w-3" />
                    Juiced
                  </span>
                )}
              </h3>
              <span className="text-xs text-muted-foreground">
                {new Date(run.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Player:</span>{' '}
                <span className="font-medium">{run.username}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Enemies:</span>{' '}
                <span className="font-medium">{run.enemiesDefeated}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Algorithm:</span>{' '}
                <span className="font-medium">{run.algorithmUsed?.toUpperCase() || 'Unknown'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
