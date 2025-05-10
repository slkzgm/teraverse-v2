// path: src/app/(dashboard)/_components/dungeon-list.tsx
'use client'

import { Button } from '@/components/ui/button'
import type { TodayDungeonDataEntity } from '@slkzgm/gigaverse-sdk'
import { Flame, Zap } from 'lucide-react'

interface DungeonListProps {
  dungeons: Record<number, TodayDungeonDataEntity>
  dayProgressMap: Record<number, number>
  currentEnergy: number
  isPlayerJuiced: boolean
  onStartRun: (dungeonId: number, isJuiced: boolean) => void
}

export function DungeonList({
  dungeons,
  dayProgressMap,
  currentEnergy,
  isPlayerJuiced,
  onStartRun,
}: DungeonListProps) {
  if (Object.keys(dungeons).length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-lg font-semibold">Available Dungeons</h2>
        <p className="text-muted-foreground">No dungeons available.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-lg font-semibold">Available Dungeons</h2>
      <div className="space-y-3">
        {Object.entries(dungeons).map(([key, data]) => {
          const dungeonId = Number(key)
          const runsUsed = dayProgressMap[dungeonId] || 0

          const normalCost = data.ENERGY_CID
          const juicedCost = normalCost * 3

          const normalMax = data.UINT256_CID
          const juicedMax = data.juicedMaxRunsPerDay
          const effectiveMax = isPlayerJuiced ? juicedMax : normalMax

          const canRunNormal = runsUsed < effectiveMax && currentEnergy >= normalCost
          const canRunJuiced =
            isPlayerJuiced && runsUsed + 3 <= juicedMax && currentEnergy >= juicedCost

          return (
            <div key={dungeonId} className="rounded-md border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{data.NAME_CID}</h3>
                  <p className="text-xs text-muted-foreground">
                    Runs: {runsUsed} / {effectiveMax}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">ID: {dungeonId}</div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="sm"
                  variant={canRunNormal ? 'default' : 'outline'}
                  disabled={!canRunNormal}
                  onClick={() => onStartRun(dungeonId, false)}
                  className="h-10 flex-1 sm:h-8"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  Normal ({normalCost})
                </Button>
                {isPlayerJuiced && (
                  <Button
                    size="sm"
                    variant={canRunJuiced ? 'default' : 'outline'}
                    disabled={!canRunJuiced}
                    onClick={() => onStartRun(dungeonId, true)}
                    className="h-10 flex-1 sm:h-8"
                  >
                    <Flame className="mr-1 h-3 w-3" />
                    Juiced ({juicedCost})
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
