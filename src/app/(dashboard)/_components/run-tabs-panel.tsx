// path: src/app/(dashboard)/_components/run-tabs-panel.tsx
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRunHistoryStore } from '@/store/useRunHistoryStore'
import { Trash2 } from 'lucide-react'
import { RunHistoryContent } from './run-history-content'
import { RunStatsContent } from './run-stats-content'

/**
 * Displays two tabs:
 *  - HISTORY -> <RunHistoryContent/>
 *  - STATS -> <RunStatsContent/>
 *
 * A shared layout: same container, top row with tab buttons + Clear button,
 * and a body that conditionally renders one of the two subcomponents.
 */

export function RunTabsPanel() {
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history')
  const { runs, clearRuns } = useRunHistoryStore()

  const noRuns = runs.length === 0

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* ---- Top Row (Tabs + Clear) ---- */}
      <div className="mb-4 flex items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center space-x-2">
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('history')}
          >
            History
          </Button>
          <Button
            variant={activeTab === 'stats' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </Button>
        </div>

        {/* Clear Button */}
        <Button variant="outline" size="sm" onClick={clearRuns} disabled={noRuns}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>

      {/* ---- Body: Conditionally render subcomponent ---- */}
      {activeTab === 'history' ? (
        <RunHistoryContent runs={runs} />
      ) : (
        <RunStatsContent runs={runs} />
      )}
    </div>
  )
}
