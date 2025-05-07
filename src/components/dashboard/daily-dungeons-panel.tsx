// path: src/app/dashboard/components/daily-dungeons-panel.tsx
'use client'

import React from 'react'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { useGameDataStore } from '@/store/useGameDataStore'

/**
 * A minimal component displaying per-dungeon daily data:
 * - Name
 * - Current runs used / max runs
 * - Energy cost (normal + juiced)
 *
 * For user-specific run counts, we read from `dayProgressMap` in useGigaverseStore.
 * For "static daily" dungeon info, we read from `todayDungeonsMap` in useGameDataStore.
 */
export function DailyDungeonsPanel() {
  const { dayProgressMap } = useGigaverseStore()
  const { todayDungeonsMap } = useGameDataStore()

  const ids = Object.keys(todayDungeonsMap)
  if (!ids.length) {
    return <p>No daily dungeon data found.</p>
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Daily Dungeons Info</h3>
      {ids.map((key) => {
        const dungeonId = Number(key)
        const data = todayDungeonsMap[dungeonId]
        const runsUsed = dayProgressMap[dungeonId] || 0

        return (
          <div key={dungeonId} style={{ padding: '8px 0' }}>
            <strong>
              Dungeon #{dungeonId}: {data.NAME_CID}
            </strong>
            <p style={{ margin: '4px 0' }}>
              Runs: {runsUsed} / {data.UINT256_CID} (normal) — or up to {data.juicedMaxRunsPerDay}{' '}
              (juiced)
            </p>
            <p style={{ margin: '4px 0' }}>
              Energy Cost: {data.ENERGY_CID} (normal), {data.ENERGY_CID * 3} (juiced)
            </p>
          </div>
        )
      })}
    </div>
  )
}
