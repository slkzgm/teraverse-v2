// path: src/app/(dashboard)/_components/active-run-panel.tsx
'use client'

import { Button } from '@/components/ui/button'
import type React from 'react'
import type { DungeonData, LootOption, Player } from '@slkzgm/gigaverse-sdk'
import { GigaverseActionType } from '@slkzgm/gigaverse-engine'
import { Shield, Heart, FileText, Scroll, Skull, Star } from 'lucide-react'
import {
  formatLootType,
  formatLootValues,
  moveDisplayNames,
  getRarityColorClass,
} from '@/utils/lootFormatter'

interface ActiveRunPanelProps {
  dungeonState: DungeonData
  onPlayMove: (move: GigaverseActionType) => void
  recommendedMove: GigaverseActionType | null
}

export function ActiveRunPanel({ dungeonState, onPlayMove, recommendedMove }: ActiveRunPanelProps) {
  if (!dungeonState || !dungeonState.run) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-muted-foreground">No active run.</p>
      </div>
    )
  }

  const roomNum = dungeonState.entity?.ROOM_NUM_CID || 0
  const floor = 1 + Math.floor((roomNum - 1) / 4)
  const room = 1 + ((roomNum - 1) % 4)

  const player = dungeonState.run.players[0]
  const enemy = dungeonState.run.players[1]

  const isLootPhase = dungeonState.run.lootPhase && dungeonState.run.lootOptions?.length > 0

  const rockCharges = player.rock?.currentCharges ?? 0
  const paperCharges = player.paper?.currentCharges ?? 0
  const scissorCharges = player.scissor?.currentCharges ?? 0

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold">Dungeon Progress</h3>
          <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            Floor {floor}, Room {room}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PlayerCard title="Player" player={player} />
          <PlayerCard title="Enemy" player={enemy} />
        </div>
      </div>

      {isLootPhase ? (
        <LootOptionsPanel
          lootOptions={dungeonState.run.lootOptions!}
          onPickLoot={onPlayMove}
          recommendedMove={recommendedMove}
        />
      ) : (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold">Combat Moves</h3>
          <div className="grid grid-cols-3 gap-2">
            <RecommendedButton
              isRecommended={recommendedMove === GigaverseActionType.MOVE_ROCK}
              onClick={() => onPlayMove(GigaverseActionType.MOVE_ROCK)}
              disabled={rockCharges < 1}
            >
              {moveDisplayNames.rock}
            </RecommendedButton>
            <RecommendedButton
              isRecommended={recommendedMove === GigaverseActionType.MOVE_PAPER}
              onClick={() => onPlayMove(GigaverseActionType.MOVE_PAPER)}
              disabled={paperCharges < 1}
            >
              {moveDisplayNames.paper}
            </RecommendedButton>
            <RecommendedButton
              isRecommended={recommendedMove === GigaverseActionType.MOVE_SCISSOR}
              onClick={() => onPlayMove(GigaverseActionType.MOVE_SCISSOR)}
              disabled={scissorCharges < 1}
            >
              {moveDisplayNames.scissor}
            </RecommendedButton>
          </div>
        </div>
      )}
    </div>
  )
}

function RecommendedButton({
  isRecommended,
  onClick,
  disabled,
  children,
  className = '',
}: {
  isRecommended: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="relative">
      {isRecommended && !disabled && (
        <div className="absolute -left-2 -top-2 z-10">
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        </div>
      )}
      <Button
        variant="outline"
        className={`h-12 w-full flex-1 sm:h-auto ${
          isRecommended ? 'border-2 border-yellow-400' : ''
        } ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </Button>
    </div>
  )
}

function PlayerCard({ title, player }: { title: string; player?: Player }) {
  if (!player) {
    return (
      <div className="rounded-md border border-border bg-background p-3">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  const hp = player.health?.current ?? 0
  const maxHP = player.health?.currentMax ?? 0
  const hpPercentage = Math.round((hp / maxHP) * 100)
  const isDead = hp <= 0

  const shield = player.shield?.current ?? 0
  const maxShield = player.shield?.currentMax ?? 0
  const shieldPercentage = maxShield > 0 ? Math.round((shield / maxShield) * 100) : 0

  return (
    <div
      className={`relative rounded-md border border-border bg-background p-3 ${
        isDead ? 'opacity-80' : ''
      }`}
    >
      {isDead && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-black/40">
          <div className="flex flex-col items-center rounded-lg bg-black/60 p-3">
            <Skull className="h-12 w-12 text-red-500" />
            <span className="mt-1 text-base font-bold text-red-500">DEFEATED</span>
          </div>
        </div>
      )}

      <h4 className="mb-2 font-medium">{title}</h4>

      <div className="mb-2 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Heart className="mr-1 h-4 w-4 text-red-500" />
            <span>Health</span>
          </div>
          <span>
            {hp}/{maxHP}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-red-500/20">
          <div className="h-full rounded-full bg-red-500" style={{ width: `${hpPercentage}%` }} />
        </div>
      </div>

      <div className="mb-2 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Shield className="mr-1 h-4 w-4 text-blue-500" />
            <span>Armor</span>
          </div>
          <span>
            {shield}/{maxShield}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-blue-500/20">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${shieldPercentage}%` }}
          />
        </div>
      </div>

      <div className="mt-3 space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span>{moveDisplayNames.rock}</span>
          <span>
            ATK: {player.rock?.currentATK ?? 0}, DEF: {player.rock?.currentDEF ?? 0}, Charges:{' '}
            {player.rock?.currentCharges ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>{moveDisplayNames.paper}</span>
          <span>
            ATK: {player.paper?.currentATK ?? 0}, DEF: {player.paper?.currentDEF ?? 0}, Charges:{' '}
            {player.paper?.currentCharges ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>{moveDisplayNames.scissor}</span>
          <span>
            ATK: {player.scissor?.currentATK ?? 0}, DEF: {player.scissor?.currentDEF ?? 0}, Charges:{' '}
            {player.scissor?.currentCharges ?? 0}
          </span>
        </div>
      </div>

      {player.lastMove && (
        <div className="mt-2 rounded bg-muted/50 px-2 py-1 text-xs">
          Last Move:{' '}
          <span className="font-medium">
            {player.lastMove in moveDisplayNames
              ? moveDisplayNames[player.lastMove as keyof typeof moveDisplayNames]
              : player.lastMove}
          </span>
        </div>
      )}
    </div>
  )
}

function LootOptionsPanel({
  lootOptions,
  onPickLoot,
  recommendedMove,
}: {
  lootOptions: LootOption[]
  onPickLoot: (move: GigaverseActionType) => void
  recommendedMove: GigaverseActionType | null
}) {
  if (!lootOptions.length) return null

  const lootActions = [
    GigaverseActionType.PICK_LOOT_ONE,
    GigaverseActionType.PICK_LOOT_TWO,
    GigaverseActionType.PICK_LOOT_THREE,
    GigaverseActionType.PICK_LOOT_FOUR,
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center">
        <Scroll className="mr-2 h-5 w-5 text-primary" />
        <h3 className="font-semibold">Choose Loot</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {lootOptions.map((loot, index) => {
          const moveType = lootActions[index]
          const isRecommended = recommendedMove === moveType

          const formattedLootName = formatLootType(loot.boonTypeString)
          const formattedValues = formatLootValues(
            loot.boonTypeString,
            loot.selectedVal1,
            loot.selectedVal2
          )
          const rarityColorClass = getRarityColorClass(loot.RARITY_CID)

          return (
            <div
              key={loot.docId || index}
              className="flex flex-col rounded-md border border-border bg-background p-3"
            >
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{formattedLootName}</span>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${rarityColorClass}`}>
                    {loot.RARITY_CID}
                  </span>
                </div>
                {formattedValues && (
                  <p className="text-xs text-muted-foreground">{formattedValues}</p>
                )}
              </div>
              <RecommendedButton
                isRecommended={isRecommended}
                onClick={() => onPickLoot(moveType)}
                className="mt-auto"
              >
                <FileText className="mr-1 h-3 w-3" />
                Select Loot {index + 1}
              </RecommendedButton>
            </div>
          )
        })}
      </div>
    </div>
  )
}
