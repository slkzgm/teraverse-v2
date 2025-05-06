// path: src/app/dashboard/components/aggregated-changes-panel.tsx
'use client'

import React from 'react'
import { useGameDataStore } from '@/store/useGameDataStore'
import type { GameItemBalanceChange } from '@slkzgm/gigaverse-sdk'

/**
 * AggregatedChangesPanel displays item balance changes by name instead of ID.
 */
export function AggregatedChangesPanel({ changes }: { changes: GameItemBalanceChange[] }) {
  const { itemsMap } = useGameDataStore()

  if (!changes.length) return null

  // Tally each itemId => sum of changes
  const aggregated = changes.reduce(
    (acc, change) => {
      acc[change.id] = (acc[change.id] || 0) + change.amount
      return acc
    },
    {} as Record<number, number>
  )

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Aggregated Item Changes</h3>
      {Object.entries(aggregated).map(([itemId, total]) => {
        // Convert the key from string to number
        const numericId = parseInt(itemId, 10)
        const itemEntity = itemsMap[numericId]
        // Fallback to a placeholder if no item name is found
        const itemName = itemEntity?.NAME_CID || `Unknown (ID_CID=${itemId})`

        return (
          <p key={itemId}>
            {itemName}: {total}
          </p>
        )
      })}
    </div>
  )
}
