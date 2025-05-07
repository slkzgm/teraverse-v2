// path: src/app/dashboard/components/run-history-panel.tsx
'use client'

import React from 'react'
import { useRunHistoryStore } from '@/store/useRunHistoryStore'
// import { useGameDataStore } from '@/store/useGameDataStore'

export function RunHistoryPanel() {
  const { runs, clearRuns } = useRunHistoryStore()
  // const { itemsMap } = useGameDataStore()
  if (!runs.length) {
    return (
      <div style={{ marginTop: 20 }}>
        <h3>Local Run History</h3>
        <p>No local run history.</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Local Run History</h3>
      <button onClick={clearRuns} style={{ marginBottom: 10 }}>
        Clear All
      </button>
      {runs.map((run, index) => {
        // For each run recap, we map the item IDs to actual names:
        // const itemEntries = Object.entries(run.itemChanges) // [ [ "2", 160 ], [ "5", 3 ], ... ]
        return (
          <div key={index} style={{ border: '1px solid #ccc', padding: '6px', marginBottom: 6 }}>
            <p>
              <strong>
                {run.dungeonName} {run.isJuiced ? '(Juiced)' : '(Normal)'}
              </strong>
            </p>
            <p>
              {run.username} ({run.address.slice(0, 6)}...{run.address.slice(-4)}) - Noob #
              {run.noobId}
            </p>
            <p>Enemies Defeated: {run.enemiesDefeated}</p>
            <p>Time: {new Date(run.timestamp).toLocaleString()}</p>
            {/*<p>*/}
            {/*  Item Changes:*/}
            {/*  {itemEntries.length === 0 && ' (None)'}*/}
            {/*</p>*/}
            {/*{itemEntries.map(([itemId, amount]) => {*/}
            {/*  const numericId = parseInt(itemId, 10)*/}
            {/*  const itemEntity = itemsMap[numericId]*/}
            {/*  const itemName = itemEntity?.NAME_CID || `Unknown (ID=${itemId})`*/}
            {/*  return (*/}
            {/*    <p key={itemId}>*/}
            {/*      • {itemName}: {amount}*/}
            {/*    </p>*/}
            {/*  )*/}
            {/*})}*/}
          </div>
        )
      })}
    </div>
  )
}
