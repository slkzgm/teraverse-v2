// path: src/app/dashboard/page.tsx
'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Actions
import {
  validateTokenAction,
  fetchDungeonState,
  playMove,
  startRunAction,
} from '@/actions/gigaverseActions'
import { callGigaverseAction } from '@/utils/callGigaverseAction'

// Stores
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { useAlgorithmStore } from '@/store/useAlgorithmStore'
import { useGameDataStore } from '@/store/useGameDataStore'

// UI
import AlgorithmSelector from '@/components/algorithm-selector'
import {
  MctsAlgorithm,
  type GigaverseActionType,
  buildGigaverseRunState
} from '@slkzgm/gigaverse-engine'
import { silentLogger } from '@/utils/silentLogger'

// Types from the SDK
import type { GameItemBalanceChange, DungeonData } from '@slkzgm/gigaverse-sdk'

/** MCTS configuration if user picks 'mcts'. */
const mctsConfig = {
  simulationsCount: 300,
  maxDepth: 2,
}

interface StepLog {
  userMove: string
  enemyMove: string
  userHPBefore: number
  userHPAfter: number
  enemyHPBefore: number
  enemyHPAfter: number
  timestamp: number
}

/**
 * A Next.js 13 page demonstrating:
 * - Extended UI for player/enemy stats
 * - Floor/room calculation from ROOM_NUM_CID
 * - Aggregated item changes from each move
 * - Recap of chosen loot or step logs
 */
export default function DashboardPage() {
  const router = useRouter()

  // Auth + algorithm store
  const { bearerToken, expiresAt } = useAuthStore()
  const { selectedAlgorithm, autoPlay, setAutoPlay } = useAlgorithmStore()

  // Gigaverse store
  const { dungeonState } = useGigaverseStore()

  // Game data
  const { enemies, items, isLoading, error, loadEnemies, loadItems } = useGameDataStore()

  // Local states
  const [isChecking, setIsChecking] = useState(true)
  const [localError, setLocalError] = useState('')

  /**
   * Aggregated changes across the entire run:
   * We store every 'gameItemBalanceChanges' from each move.
   */
  const [balanceChangesHistory, setBalanceChangesHistory] = useState<GameItemBalanceChange[]>([])

  /**
   * Step-by-step logs of each move: user's move, enemy's move, HP changes, etc.
   */
  const [battleHistory, setBattleHistory] = useState<StepLog[]>([])

  // MCTS ref
  const mctsRef = useRef<MctsAlgorithm | null>(null)
  useEffect(() => {
    if (selectedAlgorithm === 'mcts') {
      mctsRef.current = new MctsAlgorithm(mctsConfig, silentLogger)
    } else {
      mctsRef.current = null
    }
  }, [selectedAlgorithm])

  // concurrency guard
  const isAutoPlayingRef = useRef(false)

  /**
   * 1) Validate token or redirect
   */
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

  /**
   * 2) Load enemies/items post validation
   */
  useEffect(() => {
    if (!bearerToken || isChecking) return
    if (enemies.length === 0) loadEnemies(bearerToken)
    if (items.length === 0) loadItems(bearerToken)
  }, [bearerToken, isChecking, enemies, items, loadEnemies, loadItems])

  // ----------------------------------------------------------------
  // RECOMMENDED MOVE
  // ----------------------------------------------------------------
  function getRecommendedMove(): GigaverseActionType | null {
    const ds = useGigaverseStore.getState().dungeonState
    if (!ds) return null

    if (selectedAlgorithm === 'manual') return null

    // random
    if (selectedAlgorithm === 'random') {
      const possible: GigaverseActionType[] = []
      if (ds.run?.lootPhase && ds.run.lootOptions?.length) {
        if (ds.run.lootOptions.length >= 1) possible.push('loot_one')
        if (ds.run.lootOptions.length >= 2) possible.push('loot_two')
        if (ds.run.lootOptions.length >= 3) possible.push('loot_three')
      } else {
        possible.push('rock', 'paper', 'scissor')
      }
      if (possible.length === 0) return null
      return possible[Math.floor(Math.random() * possible.length)]
    }

    // mcts
    if (selectedAlgorithm === 'mcts' && mctsRef.current) {
      try {
        const runState = buildGigaverseRunState(ds, enemies)
        const action = mctsRef.current.pickAction(runState)
        return action.type
      } catch (err) {
        console.error('[Dashboard] MCTS pickAction error:', err)
      }
    }

    return null
  }

  /**
   * Single move => calls playMove => store step logs & aggregated changes
   */
  async function handlePlayMove(move: GigaverseActionType) {
    setLocalError('')
    const { bearerToken: currentToken } = useAuthStore.getState()
    if (!currentToken) {
      setLocalError('No bearer token. Please re-login.')
      return
    }

    // read current state to see HP before
    const dsBefore = useGigaverseStore.getState().dungeonState
    const userHPBefore = dsBefore?.run?.players[0].health.current ?? 0
    const enemyHPBefore = dsBefore?.run?.players[1].health.current ?? 0
    const dungeonId = dsBefore?.entity?.ID_CID ? parseInt(dsBefore.entity.ID_CID) : 1
    const { actionToken } = useGigaverseStore.getState()

    try {
      const result = await callGigaverseAction(
          playMove,
          currentToken,
          actionToken,
          dungeonId,
          move
      )
      if (!result.success) {
        throw new Error(result.message || 'Failed to play move.')
      }

      // If we have balance changes, aggregate them
      if (result.gameItemBalanceChanges && result.gameItemBalanceChanges.length > 0) {
        setBalanceChangesHistory(prev => [...prev, ...result.gameItemBalanceChanges!])
      }

      // Now that the store is updated with the new state, read HP/moves after
      const dsAfter = useGigaverseStore.getState().dungeonState
      const userHPAfter = dsAfter?.run?.players[0].health.current ?? 0
      const enemyHPAfter = dsAfter?.run?.players[1].health.current ?? 0
      const userMove = dsAfter?.run?.players[0].lastMove || move
      const enemyMove = dsAfter?.run?.players[1].lastMove || 'unknown'

      // Record this step in battleHistory
      const stepLog: StepLog = {
        userMove,
        enemyMove,
        userHPBefore,
        userHPAfter,
        enemyHPBefore,
        enemyHPAfter,
        timestamp: Date.now()
      }
      setBattleHistory(prev => [...prev, stepLog])

    } catch (err) {
      console.error('[Dashboard] handlePlayMove error:', err)
      setLocalError(err instanceof Error ? err.message : 'Move error.')
      throw err
    }
  }

  /**
   * Refresh => fetchDungeonState
   */
  async function refreshDungeon() {
    const { bearerToken: currentToken } = useAuthStore.getState()
    if (!currentToken) return
    await callGigaverseAction(fetchDungeonState, currentToken)
  }

  /**
   * If run ended => setAutoPlay(false), refresh
   */
  async function checkRunOverAndRefresh(): Promise<boolean> {
    const ds = useGigaverseStore.getState().dungeonState
    if (!ds || !ds.run) {
      console.log('[AutoPlay] No run => ended.')
      setAutoPlay(false)
      await refreshDungeon()
      return true
    }
    const userHP = ds.run.players[0].health.current
    if (userHP <= 0) {
      console.log('[AutoPlay] Player HP=0 => ended.')
      setAutoPlay(false)
      await refreshDungeon()
      return true
    }
    if (ds.entity?.COMPLETE_CID) {
      console.log('[AutoPlay] COMPLETE_CID => ended.')
      setAutoPlay(false)
      await refreshDungeon()
      return true
    }
    return false
  }

  /**
   * The chain: pick => move => short delay => repeat
   */
  async function runAutoPlayChain() {
    if (isAutoPlayingRef.current) return
    isAutoPlayingRef.current = true
    try {
      let steps = 60
      while (useAlgorithmStore.getState().autoPlay && steps > 0) {
        const ended = await checkRunOverAndRefresh()
        if (ended) break

        const move = getRecommendedMove()
        if (!move) {
          console.log('[AutoPlay] No recommended move => stop.')
          break
        }
        console.log('[AutoPlay] Move =>', move)
        await handlePlayMove(move)

        await new Promise(r => setTimeout(r, 50))
        steps--
      }
      if (steps <= 0) {
        console.warn('[AutoPlay] Safety break => too many moves.')
      }
      // final check
      await checkRunOverAndRefresh()
    } catch (err) {
      console.error('[AutoPlayChain] error =>', err)
    } finally {
      isAutoPlayingRef.current = false
    }
  }

  // If autoPlay => run chain
  useEffect(() => {
    if (autoPlay) {
      runAutoPlayChain()
    } else {
      isAutoPlayingRef.current = false
    }
  }, [autoPlay])

  /**
   * Start or fetch dungeon
   */
  async function handleFetchDungeon() {
    setLocalError('')
    const { bearerToken: currentToken } = useAuthStore.getState()
    if (!currentToken) {
      setLocalError('No bearer token. Please re-login.')
      return
    }
    const result = await callGigaverseAction(fetchDungeonState, currentToken)
    if (!result.success) {
      setLocalError(result.message || 'Failed to fetch dungeon.')
    }
  }

  async function handleStartRun(dungeonId: number) {
    setLocalError('')
    const { bearerToken: currentToken } = useAuthStore.getState()
    if (!currentToken) {
      setLocalError('No bearer token. Please re-login.')
      return
    }
    const result = await callGigaverseAction(startRunAction, currentToken, dungeonId)
    if (!result.success) {
      setLocalError(result.message || 'Failed to start run.')
    }
  }

  if (isChecking) return <p>Checking your session...</p>
  if (isLoading) return <p>Loading data from server...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  // If we have a run, let's see recommended move
  let recommendedMove: GigaverseActionType | null = null
  if (dungeonState && selectedAlgorithm !== 'manual') {
    recommendedMove = getRecommendedMove()
  }

  // A small helper to compute floor/room from ROOM_NUM_CID
  function computeFloorRoom(entity: DungeonData['entity']) {
    if (!entity) return { floor: 0, room: 0 }
    const roomNum = entity.ROOM_NUM_CID
    // floor => 1 + (roomNum-1)//4
    // room => 1 + (roomNum-1)%4
    const floor = 1 + Math.floor((roomNum - 1) / 4)
    const room = 1 + ((roomNum - 1) % 4)
    return { floor, room }
  }

  const isAutoPlaying = autoPlay

  return (
      <main style={{ padding: 20 }}>
        <h1>Dashboard - Extended UI</h1>
        {localError && <p style={{ color: 'red' }}>{localError}</p>}

        <AlgorithmSelector />

        {/* A Play/Pause button for auto-play */}
        <div style={{ margin: '10px 0' }}>
          <button onClick={() => setAutoPlay(!isAutoPlaying)}>
            {isAutoPlaying ? 'Pause Auto-Play' : 'Play Auto-Play'}
          </button>
        </div>

        <button onClick={handleFetchDungeon}>Fetch Dungeon State</button>

        {dungeonState ? (
            <section style={{ marginTop: 20 }}>
              {/* 1) Floor/Room Display */}
              <DungeonRoomInfo entity={dungeonState.entity} />

              {/* 2) Player/Enemy Stats */}
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                <PlayerStatsPanel
                    title="Player"
                    player={dungeonState.run?.players?.[0]}
                />
                <PlayerStatsPanel
                    title="Enemy"
                    player={dungeonState.run?.players?.[1]}
                />
              </div>

              {/* 3) Moves + recommended */}
              <div style={{ marginTop: 20 }}>
                <h3>Manual Moves</h3>
                <button onClick={() => handlePlayMove('rock')}>Rock</button>
                <button onClick={() => handlePlayMove('paper')}>Paper</button>
                <button onClick={() => handlePlayMove('scissor')}>Scissor</button>
                <button onClick={() => handlePlayMove('loot_one')}>Loot One</button>
                <button onClick={() => handlePlayMove('loot_two')}>Loot Two</button>
                <button onClick={() => handlePlayMove('loot_three')}>Loot Three</button>
              </div>

              {recommendedMove && (
                  <p style={{ marginTop: 10 }}>
                    Recommended Move: <strong>{recommendedMove}</strong>
                  </p>
              )}

              {/* 4) If auto-play is off, user can do it once */}
              {!isAutoPlaying && (
                  <button style={{ marginTop: 10 }} onClick={runAutoPlayChain}>
                    Play Auto-Play Once
                  </button>
              )}

              {/* 5) Aggregated item changes */}
              <AggregatedChangesPanel changes={balanceChangesHistory} />

              {/* 6) Step-by-step logs */}
              <BattleLogsPanel logs={battleHistory} />
            </section>
        ) : (
            // No run => let user start one
            <section style={{ marginTop: 20 }}>
              <h2>No Active Run</h2>
              <p>No dungeon is in progress. Start one below:</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button onClick={() => handleStartRun(1)}>Start Normal (ID=1)</button>
                <button onClick={() => handleStartRun(2)}>Start Giga (ID=2)</button>
              </div>
            </section>
        )}
      </main>
  )
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   Additional Components for Stats & Logs
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

/**
 * Shows the floor/room from ROOM_NUM_CID (4 rooms per floor).
 */
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

/**
 * Displays a player's stats: HP, Armor, R/P/S charges, lastMove, etc.
 */
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
        <p>HP: {hp} / {maxHP}</p>
        <p>Armor: {shield} / {maxShield}</p>
        <p>Rock charges: {player.rock?.currentCharges ?? 0}</p>
        <p>Paper charges: {player.paper?.currentCharges ?? 0}</p>
        <p>Scissor charges: {player.scissor?.currentCharges ?? 0}</p>
        <p>Last Move: {player.lastMove || 'None'}</p>
      </div>
  )
}

/**
 * Shows aggregated item changes from all moves in the run.
 */
function AggregatedChangesPanel({ changes }: { changes: GameItemBalanceChange[] }) {
  if (!changes.length) return null

  // We can do a quick sum by itemId for demonstration
  // i.e. itemId => total
  const aggregated = changes.reduce((acc, c) => {
    const key = c.id
    acc[key] = (acc[key] || 0) + c.amount
    return acc
  }, {} as Record<number, number>)

  return (
      <div style={{ marginTop: 20 }}>
        <h3>Aggregated Item Changes</h3>
        {Object.entries(aggregated).map(([itemId, total]) => (
            <p key={itemId}>
              Item {itemId} => total change: {total}
            </p>
        ))}
      </div>
  )
}

/**
 * Shows a step-by-step log of each move: user's move, enemy's move, HP changes, etc.
 */
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
              <p>User Move: {log.userMove} | Enemy Move: {log.enemyMove}</p>
              <p>
                HP: {log.userHPBefore} => {log.userHPAfter} (You),{' '}
                {log.enemyHPBefore} => {log.enemyHPAfter} (Enemy)
              </p>
            </div>
        ))}
      </div>
  )
}
