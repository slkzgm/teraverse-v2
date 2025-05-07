// path: src/app/dashboard/components/run-recap-panel.tsx
'use client'

import React from 'react'
import { useGameDataStore } from '@/store/useGameDataStore'
import type { GameItemBalanceChange, DungeonData } from '@slkzgm/gigaverse-sdk'

interface RunRecapPanelProps {
  /**
   * The current list of all item balance changes for the ongoing run,
   * or the entire session so far.
   */
  changes: GameItemBalanceChange[]

  /**
   * The currently active dungeonState, if any. We can read entity.ROOM_NUM_CID
   * to know how many enemies have been defeated so far (roomNum - 1).
   * If no active run, pass null.
   */
  dungeonState: DungeonData | null

  /**
   * If there's no active run, we might display how many enemies were defeated
   * in the previous run (e.g., finalEnemiesDefeated).
   * If you don't need it, you can omit this prop.
   */
  finalEnemiesDefeated?: number
}

/**
 * RunRecapPanel combines:
 * - An aggregated list of all item changes gained.
 * - The count of enemies defeated so far (if run is active),
 *   or the final count from the previous run if no run is active.
 */
export function RunRecapPanel({
  changes,
  dungeonState,
  finalEnemiesDefeated = 0,
}: RunRecapPanelProps) {
  const { itemsMap } = useGameDataStore()

  // 1) Compute aggregated item changes
  const aggregatedItems = changes.reduce<Record<number, number>>((acc, change) => {
    acc[change.id] = (acc[change.id] || 0) + change.amount
    return acc
  }, {})

  // 2) Compute enemiesDefeated from active run or from finalEnemiesDefeated
  let enemiesDefeatedCount = finalEnemiesDefeated
  if (dungeonState && dungeonState.entity?.ROOM_NUM_CID) {
    // If there's an active run, the number of enemies defeated so far is (roomNum - 1)
    enemiesDefeatedCount = Math.max(0, dungeonState.entity.ROOM_NUM_CID - 1)
  }

  // If there are no aggregated changes & no enemies defeated, let's not display anything
  const hasNoChanges = Object.keys(aggregatedItems).length === 0
  if (hasNoChanges && enemiesDefeatedCount === 0) {
    return null
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Run Recap</h3>
      <p>Enemies Defeated: {enemiesDefeatedCount}</p>
      {/* Only show item changes if any */}
      {Object.entries(aggregatedItems).length > 0 && (
        <div style={{ marginTop: 8 }}>
          <strong>Item Changes:</strong>
          {Object.entries(aggregatedItems).map(([itemId, total]) => {
            const numericId = parseInt(itemId, 10)
            const itemEntity = itemsMap[numericId]
            const itemName = itemEntity?.NAME_CID || `Unknown (ID_CID=${itemId})`
            return (
              <p key={itemId}>
                {itemName}: {total}
              </p>
            )
          })}
        </div>
      )}
    </div>
  )
}
