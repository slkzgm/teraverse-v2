// path: src/app/(dashboard)/_components/run-history-panel.tsx
'use client'

import { useRunHistoryStore } from '@/store/useRunHistoryStore'
import { Button } from '@/components/ui/button'
import { Trash2, History, Flame } from 'lucide-react'

export function RunHistoryPanel() {
  const { runs, clearRuns } = useRunHistoryStore()

  if (!runs.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center">
            <History className="mr-2 h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Run History</h2>
          </div>
        </div>
        <p className="text-muted-foreground">No run history available.</p>
      </div>
    )
  }

  const sortedRuns = [...runs].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center">
          <History className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Run History</h2>
        </div>
        <Button variant="outline" size="sm" onClick={clearRuns}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>

      <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
        {sortedRuns.map((run, index) => (
          <div key={index} className="rounded-md border border-border bg-background p-3">
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
                <span className="font-medium">{(run.algorithmUsed ?? 'manual').toUpperCase()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
