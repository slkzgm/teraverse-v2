// path: src/app/dashboard/components/run-history-panel.tsx
'use client'

import React from 'react'
import { useRunHistoryStore } from '@/store/useRunHistoryStore'

export function RunHistoryPanel() {
  const { runs, clearRuns } = useRunHistoryStore()

  if (!runs.length) {
    return <p>No local run history.</p>
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Local Run History</h3>
      <button onClick={clearRuns} style={{ marginBottom: 10 }}>
        Clear All
      </button>
      {runs.map((run, index) => (
        <div key={index} style={{ border: '1px solid #ccc', padding: '6px', marginBottom: 6 }}>
          <p>
            <strong>
              {run.dungeonName} {run.isJuiced ? '(Juiced)' : '(Normal)'}
            </strong>
          </p>
          <p>Enemies Defeated: {run.enemiesDefeated}</p>
          <p>Time: {new Date(run.timestamp).toLocaleString()}</p>
          <p>
            Item Changes:
            {Object.entries(run.itemChanges).length === 0 && ' (None)'}
          </p>
          {Object.entries(run.itemChanges).map(([itemId, amount]) => (
            <p key={itemId}>
              • Item {itemId}: {amount}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}
