// path: src/app/dashboard/components/run-recap-panel.tsx
'use client'
import { useGameDataStore } from '@/store/useGameDataStore'
import type { GameItemBalanceChange, DungeonData } from '@slkzgm/gigaverse-sdk'
import { Award, Package } from 'lucide-react'

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
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center">
        <Award className="mr-2 h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Current Run Recap</h2>
      </div>

      <div className="rounded-md border border-border bg-background p-3">
        <div className="mb-2 flex items-center">
          <span className="font-medium">Enemies Defeated:</span>
          <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
            {enemiesDefeatedCount}
          </span>
        </div>

        {/* Only show item changes if any */}
        {Object.entries(aggregatedItems).length > 0 && (
          <div>
            <h3 className="mb-2 flex items-center font-medium">
              <Package className="mr-1 h-4 w-4 text-muted-foreground" />
              Item Changes
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(aggregatedItems).map(([itemId, total]) => {
                const numericId = Number.parseInt(itemId, 10)
                const itemEntity = itemsMap[numericId]
                const itemName = itemEntity?.NAME_CID || `Unknown (ID=${itemId})`

                // Determine color based on value
                let colorClass = 'text-green-500'
                if (total < 0) colorClass = 'text-red-500'

                return (
                  <div
                    key={itemId}
                    className="flex items-center justify-between rounded bg-muted/30 px-2 py-1 text-sm"
                  >
                    <span className="truncate">{itemName}</span>
                    <span className={`font-medium ${colorClass}`}>
                      {total > 0 ? `+${total}` : total}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
