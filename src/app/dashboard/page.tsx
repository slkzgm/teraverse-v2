// path: src/app/dashboard/page.tsx
'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  validateTokenAction,
  fetchDungeonState,
  playMove,
  startRunAction,
} from '@/actions/gigaverseActions'
import { callGigaverseAction } from '@/utils/callGigaverseAction'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { useAlgorithmStore } from '@/store/useAlgorithmStore'
import { useGameDataStore } from '@/store/useGameDataStore'
import AlgorithmSelector from '@/app/dashboard/components/algorithm-selector'
import {
  MctsAlgorithm,
  type GigaverseActionType,
  buildGigaverseRunState,
} from '@slkzgm/gigaverse-engine'
import { silentLogger } from '@/utils/silentLogger'
import type { GameItemBalanceChange, DungeonData, LootOption } from '@slkzgm/gigaverse-sdk'
import { DailyDungeonsPanel } from '@/app/dashboard/components/daily-dungeons-panel'
import { RunRecapPanel } from '@/app/dashboard/components/run-recap-panel'
import { useRunHistoryStore } from '@/store/useRunHistoryStore'
import { RunHistoryPanel } from '@/app/dashboard/components/run-history-panel'

interface StepLog {
  userMove: string
  enemyMove: string
  userHPBefore: number
  userHPAfter: number
  enemyHPBefore: number
  enemyHPAfter: number
  timestamp: number
}

const mctsConfig = {
  simulationsCount: 300,
  maxDepth: 2,
}

export default function DashboardPage() {
  const router = useRouter()
  const { bearerToken, expiresAt } = useAuthStore()

  // Core Zustand stores
  const {
    dungeonState,
    energyData,
    stopEnergyTimer,
    loadEnergy,
    loadDayProgress,
    incrementRunCount,
    dayProgressMap,
  } = useGigaverseStore()
  const {
    loadOffchainStatic,
    loadTodayDungeonData,
    enemies,
    gameItems,
    todayDungeonsMap,
    isLoading,
    error,
  } = useGameDataStore()
  const { selectedAlgorithm, autoPlay, setAutoPlay } = useAlgorithmStore()

  // Local states
  const [isChecking, setIsChecking] = useState(true)
  const [localError, setLocalError] = useState('')
  const [balanceChangesHistory, setBalanceChangesHistory] = useState<GameItemBalanceChange[]>([])
  const [battleHistory, setBattleHistory] = useState<StepLog[]>([])
  const [finalEnemiesDefeated, setFinalEnemiesDefeated] = useState(0)

  // Tracking current run's dungeon name & mode (juiced/normal)
  const [currentDungeonName, setCurrentDungeonName] = useState('')
  const [currentDungeonIsJuiced, setCurrentDungeonIsJuiced] = useState(false)

  // Local run history store
  const { addRun } = useRunHistoryStore()

  // Refs for MCTS and auto-play
  const mctsRef = useRef<MctsAlgorithm | null>(null)
  const isAutoPlayingRef = useRef(false)

  // ------------------------------------------------
  // Algorithm Setup
  // ------------------------------------------------
  useEffect(() => {
    if (selectedAlgorithm === 'mcts') {
      mctsRef.current = new MctsAlgorithm(mctsConfig, silentLogger)
    } else {
      mctsRef.current = null
    }
  }, [selectedAlgorithm])

  // ------------------------------------------------
  // Validate Token on Mount
  // ------------------------------------------------
  useEffect(() => {
    async function checkAccess() {
      if (!bearerToken || (expiresAt && Date.now() > expiresAt)) {
        router.push('/')
        return
      }
      try {
        const result = await validateTokenAction(bearerToken)
        if (!result.success || !result.canEnterGame || !result.address) {
          router.push('/')
        }
      } catch (err) {
        console.error('[Dashboard] Token validation error:', err)
        router.push('/')
      } finally {
        setIsChecking(false)
      }
    }
    checkAccess()
  }, [bearerToken, expiresAt, router])

  // ------------------------------------------------
  // Load offchain data, day progress, energy
  // ------------------------------------------------
  useEffect(() => {
    if (!bearerToken || isChecking) return

    // If we haven't loaded them yet
    if (enemies.length === 0 && gameItems.length === 0) {
      loadOffchainStatic(bearerToken)
    }

    loadTodayDungeonData(bearerToken)
    loadDayProgress(bearerToken)
    loadEnergy(bearerToken)

    return () => {
      stopEnergyTimer()
    }
  }, [
    bearerToken,
    isChecking,
    enemies,
    gameItems,
    loadOffchainStatic,
    loadTodayDungeonData,
    loadDayProgress,
    loadEnergy,
    stopEnergyTimer,
  ])

  // ------------------------------------------------
  // Fetch dungeon on mount => show current run
  // ------------------------------------------------
  useEffect(() => {
    if (!bearerToken || isChecking) return

    async function fetchOnMount() {
      setLocalError('')
      const result = await callGigaverseAction(fetchDungeonState, bearerToken)
      if (!result.success) {
        setLocalError(result.message || 'Failed to fetch dungeon on mount.')
      }
    }
    fetchOnMount()
  }, [bearerToken, isChecking])

  // ------------------------------------------------
  // Auto-play
  // ------------------------------------------------
  useEffect(() => {
    if (autoPlay) {
      runAutoPlayChain()
    } else {
      isAutoPlayingRef.current = false
    }
  }, [autoPlay])

  // =============================
  // Utility / Helper Logic
  // =============================
  function getRecommendedMove(): GigaverseActionType | null {
    const ds = useGigaverseStore.getState().dungeonState
    if (!ds) return null

    if (selectedAlgorithm === 'manual') return null
    if (selectedAlgorithm === 'random') {
      const possible: GigaverseActionType[] = []
      if (ds.run?.lootPhase && ds.run.lootOptions?.length) {
        ds.run.lootOptions.forEach((_, idx) => {
          possible.push(`loot_${idx + 1}` as GigaverseActionType)
        })
      } else {
        possible.push('rock', 'paper', 'scissor')
      }
      return possible[Math.floor(Math.random() * possible.length)]
    }
    if (selectedAlgorithm === 'mcts' && mctsRef.current) {
      try {
        const runState = buildGigaverseRunState(ds, enemies)
        return mctsRef.current.pickAction(runState).type
      } catch (err) {
        console.error('[Dashboard] MCTS pickAction error:', err)
      }
    }
    return null
  }

  /**
   * Collect item changes in a single map: itemId => total
   */
  function getAggregatedItemChanges() {
    const map: Record<number, number> = {}
    for (const c of balanceChangesHistory) {
      map[c.id] = (map[c.id] || 0) + c.amount
    }
    return map
  }

  async function handlePlayMove(move: GigaverseActionType) {
    if (!bearerToken) {
      setLocalError('No bearer token. Please re-login.')
      return
    }
    setLocalError('')

    const ds = dungeonState
    if (!ds?.run) return

    const userHPBefore = ds.run.players[0].health.current
    const enemyHPBefore = ds.run.players[1].health.current
    const dungeonId = ds.entity?.ID_CID ? parseInt(ds.entity.ID_CID) : 1
    const { actionToken } = useGigaverseStore.getState()

    try {
      const result = await callGigaverseAction(playMove, bearerToken, actionToken, dungeonId, move)
      if (!result.success) {
        throw new Error(result.message || 'Failed to play move.')
      }

      // If we got item changes this step, merge them into our local array
      if (result.gameItemBalanceChanges?.length) {
        setBalanceChangesHistory((prev) => [...prev, ...result.gameItemBalanceChanges!])
      }

      // Grab updated dungeonState
      const dsAfter = useGigaverseStore.getState().dungeonState
      if (!dsAfter?.run) return

      const userHPAfter = dsAfter.run.players[0].health.current
      const enemyHPAfter = dsAfter.run.players[1].health.current
      const userMove = dsAfter.run.players[0].lastMove || move
      const enemyMove = dsAfter.run.players[1].lastMove || 'unknown'

      // Record a step in local battleHistory
      setBattleHistory((prev) => [
        ...prev,
        {
          userMove,
          enemyMove,
          userHPBefore,
          userHPAfter,
          enemyHPBefore,
          enemyHPAfter,
          timestamp: Date.now(),
        },
      ])
    } catch (err) {
      console.error('[Dashboard] handlePlayMove error:', err)
      setLocalError(err instanceof Error ? err.message : 'Move error.')
    }
  }

  async function handleStartRun(dungeonId: number, isJuiced: boolean) {
    if (!bearerToken) return
    setLocalError('')

    const { actionToken } = useGigaverseStore.getState()
    const result = await callGigaverseAction(
      startRunAction,
      bearerToken,
      actionToken,
      dungeonId,
      isJuiced
    )
    if (!result.success) {
      setLocalError(result.message || 'Failed to start run.')
      return
    }

    // Clear existing logs
    setBattleHistory([])
    setBalanceChangesHistory([])
    setFinalEnemiesDefeated(0)

    // Name + juiced flags, for local run recap
    const dsName = todayDungeonsMap[dungeonId]?.NAME_CID ?? `Dungeon #${dungeonId}`
    setCurrentDungeonName(dsName)
    setCurrentDungeonIsJuiced(isJuiced)

    // In daily usage: normal => +1, juiced => +3
    incrementRunCount(dungeonId, isJuiced ? 3 : 1)

    // Refresh energy
    await loadEnergy(bearerToken)
  }

  async function handleFetchDungeon() {
    if (!bearerToken) return
    setLocalError('')

    const result = await callGigaverseAction(fetchDungeonState, bearerToken)
    if (!result.success) {
      setLocalError(result.message || 'Failed to fetch dungeon.')
    }
  }

  async function refreshAll() {
    if (!bearerToken) return
    setLocalError('')
    try {
      await Promise.all([
        loadEnergy(bearerToken),
        callGigaverseAction(fetchDungeonState, bearerToken),
        loadDayProgress(bearerToken),
        loadTodayDungeonData(bearerToken),
      ])
    } catch (err) {
      console.error('[Dashboard] refreshAll error:', err)
      setLocalError('Failed to refresh all data.')
    }
  }

  async function refreshDungeon() {
    if (!bearerToken) return
    await callGigaverseAction(fetchDungeonState, bearerToken)
  }

  /**
   * When run ends => set finalEnemiesDefeated, store aggregator in local history,
   * then refresh the dungeon so we see no active run. We also setAutoPlay(false).
   */
  async function checkRunOverAndRefresh(): Promise<boolean> {
    const ds = useGigaverseStore.getState().dungeonState
    if (!ds || !ds.run) {
      setAutoPlay(false)
      await refreshDungeon()
      return true
    }

    const userHP = ds.run.players[0].health.current
    const roomNum = ds.entity?.ROOM_NUM_CID ?? 1
    const ended = userHP <= 0 || ds.entity?.COMPLETE_CID

    if (ended) {
      setAutoPlay(false)

      const finalEnemies = Math.max(0, roomNum - 1)
      setFinalEnemiesDefeated(finalEnemies)

      // Build itemChanges from the entire run
      const itemChanges = getAggregatedItemChanges()

      // Add local run recap => local storage
      useRunHistoryStore.getState().addRun({
        dungeonId: ds.entity?.ID_CID ? parseInt(ds.entity.ID_CID) : 0,
        dungeonName: currentDungeonName,
        isJuiced: currentDungeonIsJuiced,
        enemiesDefeated: finalEnemies,
        timestamp: Date.now(),
        itemChanges,
      })

      await refreshDungeon()
      return true
    }
    return false
  }

  async function runAutoPlayChain() {
    if (isAutoPlayingRef.current) return
    isAutoPlayingRef.current = true

    try {
      let steps = 60
      while (useAlgorithmStore.getState().autoPlay && steps > 0) {
        const ended = await checkRunOverAndRefresh()
        if (ended) break

        const move = getRecommendedMove()
        if (!move) break

        await handlePlayMove(move)
        await new Promise((r) => setTimeout(r, 50))
        steps--
      }
      await checkRunOverAndRefresh()
    } catch (err) {
      console.error('[AutoPlayChain] error:', err)
    } finally {
      isAutoPlayingRef.current = false
    }
  }

  // =============================
  // Computed / Derived
  // =============================
  let displayedEnergy = 'N/A'
  let currentEnergyInt = 0
  let isPlayerJuiced = false
  if (energyData) {
    currentEnergyInt = Math.floor(energyData.energy / 1_000_000_000)
    displayedEnergy = currentEnergyInt.toString()
    isPlayerJuiced = !!energyData.isPlayerJuiced
  }

  // =============================
  // Render
  // =============================
  return (
    <main style={{ padding: 20 }}>
      {isChecking ? (
        <p>Checking your session...</p>
      ) : isLoading ? (
        <p>Loading data from server...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          {localError && <p style={{ color: 'red' }}>{localError}</p>}

          <h1>Dashboard - Extended UI</h1>
          <AlgorithmSelector />

          <p>
            Current Energy: {displayedEnergy} / {energyData ? energyData.maxEnergy : 'N/A'}
          </p>

          <DailyDungeonsPanel />

          <div style={{ margin: '10px 0' }}>
            <button onClick={() => setAutoPlay(!autoPlay)}>
              {autoPlay ? 'Pause Auto-Play' : 'Play Auto-Play'}
            </button>
          </div>

          <button onClick={handleFetchDungeon}>Fetch Dungeon State</button>
          <button onClick={refreshAll} style={{ marginLeft: 8 }}>
            Refresh All
          </button>

          {dungeonState ? (
            // --------------------------------
            // Active run
            // --------------------------------
            <section style={{ marginTop: 20 }}>
              <DungeonRoomInfo entity={dungeonState.entity} />

              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                <PlayerStatsPanel title="Player" player={dungeonState.run?.players?.[0]} />
                <PlayerStatsPanel title="Enemy" player={dungeonState.run?.players?.[1]} />
              </div>

              <div style={{ marginTop: 20 }}>
                <h3>Manual Moves</h3>
                <button onClick={() => handlePlayMove('rock')}>Rock</button>
                <button onClick={() => handlePlayMove('paper')}>Paper</button>
                <button onClick={() => handlePlayMove('scissor')}>Scissor</button>
                <button onClick={() => handlePlayMove('loot_one')}>Loot One</button>
                <button onClick={() => handlePlayMove('loot_two')}>Loot Two</button>
                <button onClick={() => handlePlayMove('loot_three')}>Loot Three</button>
                <button onClick={() => handlePlayMove('loot_four')}>Loot Four</button>
              </div>

              {selectedAlgorithm !== 'manual' && (
                <p style={{ marginTop: 10 }}>
                  Recommended Move: <strong>{getRecommendedMove() ?? 'None'}</strong>
                </p>
              )}

              {!autoPlay && (
                <button style={{ marginTop: 10 }} onClick={runAutoPlayChain}>
                  Play Auto-Play Once
                </button>
              )}

              {dungeonState.run?.lootPhase && dungeonState.run?.lootOptions?.length > 0 && (
                <LootOptionsPanel
                  lootOptions={dungeonState.run.lootOptions}
                  onPickLoot={handlePlayMove}
                />
              )}
            </section>
          ) : (
            // --------------------------------
            // No active run
            // --------------------------------
            <section style={{ marginTop: 20 }}>
              <h2>No Active Run</h2>
              <p>Pick a dungeon to start a run.</p>

              {Object.entries(todayDungeonsMap).map(([key, data]) => {
                const dungeonId = parseInt(key, 10)
                const runsUsed = dayProgressMap[dungeonId] || 0

                // For normal run
                const normalMax = data.UINT256_CID
                const normalCost = data.ENERGY_CID
                const canRunNormal = runsUsed < normalMax && currentEnergyInt >= normalCost

                // For juiced run
                const juicedMax = data.juicedMaxRunsPerDay
                const juicedCost = data.ENERGY_CID * 3
                const runsUsedJuiced = runsUsed < juicedMax
                const canRunJuiced =
                  isPlayerJuiced && runsUsedJuiced && currentEnergyInt >= juicedCost

                return (
                  <div key={dungeonId} style={{ margin: '8px 0' }}>
                    <div>
                      <strong>
                        {data.NAME_CID} (ID={dungeonId}) | Runs: {runsUsed} /{' '}
                        {isPlayerJuiced ? juicedMax : normalMax}
                      </strong>
                    </div>
                    <button
                      disabled={!canRunNormal}
                      style={{ marginRight: 6, color: canRunNormal ? 'inherit' : 'red' }}
                      onClick={() => handleStartRun(dungeonId, false)}
                    >
                      Start Normal ({normalCost} energy)
                    </button>
                    {isPlayerJuiced && (
                      <button
                        disabled={!canRunJuiced}
                        style={{ color: canRunJuiced ? 'inherit' : 'red' }}
                        onClick={() => handleStartRun(dungeonId, true)}
                      >
                        Start Juiced ({juicedCost} energy)
                      </button>
                    )}
                  </div>
                )
              })}
            </section>
          )}

          {/* Combined run recap (enemies + items) */}
          <RunRecapPanel
            changes={balanceChangesHistory}
            dungeonState={dungeonState}
            finalEnemiesDefeated={finalEnemiesDefeated}
          />

          <BattleLogsPanel logs={battleHistory} />

          {/* Panel showing entire local run history */}
          <RunHistoryPanel />
        </>
      )}
    </main>
  )
}

// -----------------------------------------------
// Helper sub-components
// -----------------------------------------------
function DungeonRoomInfo({ entity }: { entity: DungeonData['entity'] }) {
  if (!entity) return null
  const roomNum = entity.ROOM_NUM_CID
  const floor = 1 + Math.floor((roomNum - 1) / 4)
  const room = 1 + ((roomNum - 1) % 4)

  return (
    <div>
      <h3>Dungeon Progress</h3>
      <p>
        Floor: {floor}, Room: {room}
      </p>
    </div>
  )
}

function PlayerStatsPanel({ title, player }: { title: string; player?: any }) {
  if (!player) {
    return (
      <div>
        <h3>{title} Stats</h3>
        <p>No data.</p>
      </div>
    )
  }

  const hp = player.health?.current ?? 0
  const maxHP = player.health?.currentMax ?? 0
  const shield = player.shield?.current ?? 0
  const maxShield = player.shield?.currentMax ?? 0

  return (
    <div style={{ border: '1px solid #ccc', padding: '0.5rem', flex: 1 }}>
      <h3>{title} Stats</h3>
      <p>
        HP: {hp} / {maxHP}
      </p>
      <p>
        Armor: {shield} / {maxShield}
      </p>
      <p>
        Rock — Charges: {player.rock?.currentCharges ?? 0}, ATK: {player.rock?.currentATK ?? 0},
        DEF: {player.rock?.currentDEF ?? 0}
      </p>
      <p>
        Paper — Charges: {player.paper?.currentCharges ?? 0}, ATK: {player.paper?.currentATK ?? 0},
        DEF: {player.paper?.currentDEF ?? 0}
      </p>
      <p>
        Scissor — Charges: {player.scissor?.currentCharges ?? 0}, ATK:{' '}
        {player.scissor?.currentATK ?? 0}, DEF: {player.scissor?.currentDEF ?? 0}
      </p>
      <p>Last Move: {player.lastMove || 'None'}</p>
    </div>
  )
}

function BattleLogsPanel({ logs }: { logs: StepLog[] }) {
  if (!logs.length) return null

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Battle History</h3>
      {logs.map((log, idx) => (
        <div key={log.timestamp} style={{ borderBottom: '1px solid #aaa', padding: '4px 0' }}>
          <p>
            <strong>Step {idx + 1}</strong> - {new Date(log.timestamp).toLocaleTimeString()}
          </p>
          <p>
            User Move: {log.userMove} | Enemy Move: {log.enemyMove}
          </p>
          <p>
            HP: {log.userHPBefore} =&gt; {log.userHPAfter} (You), {log.enemyHPBefore} =&gt;{' '}
            {log.enemyHPAfter} (Enemy)
          </p>
        </div>
      ))}
    </div>
  )
}

function LootOptionsPanel({
  lootOptions,
  onPickLoot,
}: {
  lootOptions: LootOption[]
  onPickLoot: (move: GigaverseActionType) => void
}) {
  if (!lootOptions.length) return null

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Available Loot</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {lootOptions.map((loot, index) => (
          <div key={loot.docId || index} style={{ border: '1px solid #ccc', padding: '10px' }}>
            <p>Rarity: {loot.RARITY_CID}</p>
            <p>Boon Type: {loot.boonTypeString}</p>
            <p>Val1: {loot.selectedVal1}</p>
            <p>Val2: {loot.selectedVal2}</p>
            <button onClick={() => onPickLoot(`loot_${index + 1}` as GigaverseActionType)}>
              Pick Loot {index + 1}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
