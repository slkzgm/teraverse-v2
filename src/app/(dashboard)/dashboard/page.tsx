'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDungeonStateAction, playMoveAction, startRunAction } from '@/actions/gigaverseActions'
import { callGigaverseAction } from '@/utils/callGigaverseAction'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { useAlgorithmStore } from '@/store/useAlgorithmStore'
import { useGameDataStore } from '@/store/useGameDataStore'
// Update imports to point to the new component locations
import AlgorithmSelector from '@/app/(dashboard)/_components/algorithm-selector'
import { RunRecapPanel } from '@/app/(dashboard)/_components/run-recap-panel'
import { RunHistoryPanel } from '@/app/(dashboard)/_components/run-history-panel'
import { DungeonList } from '@/app/(dashboard)/_components/dungeon-list'
import { ActiveRunPanel } from '@/app/(dashboard)/_components/active-run-panel'
import { EnergyDisplay } from '@/app/(dashboard)/_components/energy-display'
import {
  buildGigaverseRunState,
  MctsAlgorithm,
  GigaverseActionType,
} from '@slkzgm/gigaverse-engine'
import { silentLogger } from '@/utils/silentLogger'
import type { GameItemBalanceChange } from '@slkzgm/gigaverse-sdk'
import { useRunHistoryStore } from '@/store/useRunHistoryStore'
import { Button } from '@/components/ui/button'
import { RefreshCw, Play, Pause } from 'lucide-react'
import { DashboardHeader } from '@/app/(dashboard)/_components/dashboard-header'

// MCTS configuration
const mctsConfig = {
  simulationsCount: 300,
  maxDepth: 2,
}

/**
 * Main dashboard page component that handles game state, algorithm selection,
 * and user interactions for the Teraverse application.
 */
export default function DashboardPage() {
  const { bearerToken } = useAuthStore()

  // Core Zustand stores
  const {
    address,
    username,
    noobId,
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
  const [localError, setLocalError] = useState('')
  const [balanceChangesHistory, setBalanceChangesHistory] = useState<GameItemBalanceChange[]>([])
  const [finalEnemiesDefeated, setFinalEnemiesDefeated] = useState(0)

  // Tracking current run's dungeon name & mode (juiced/normal)
  const [currentDungeonName, setCurrentDungeonName] = useState('')
  const [currentDungeonIsJuiced, setCurrentDungeonIsJuiced] = useState(false)
  const currentDungeonNameRef = useRef('')
  const currentDungeonIsJuicedRef = useRef(false)

  // Local run history store
  const { addRun } = useRunHistoryStore()

  // Refs for MCTS and auto-play
  const mctsRef = useRef<MctsAlgorithm | null>(null)
  const isAutoPlayingRef = useRef(false)
  const autoPlayRef = useRef(autoPlay)

  // Update refs when state changes
  useEffect(() => {
    currentDungeonNameRef.current = currentDungeonName
    currentDungeonIsJuicedRef.current = currentDungeonIsJuiced
    autoPlayRef.current = autoPlay
  }, [currentDungeonName, currentDungeonIsJuiced, autoPlay])

  // Initialize algorithm based on selection
  useEffect(() => {
    if (selectedAlgorithm === 'mcts') {
      mctsRef.current = new MctsAlgorithm(mctsConfig, silentLogger)
    } else {
      mctsRef.current = null
    }
  }, [selectedAlgorithm])

  // Load game data on mount
  useEffect(() => {
    if (!bearerToken || !address) return

    // Load static data if not already loaded
    if (enemies.length === 0 && gameItems.length === 0) {
      loadOffchainStatic(bearerToken)
    }

    // Load dynamic data
    loadTodayDungeonData(bearerToken)
    loadDayProgress(bearerToken)
    loadEnergy(bearerToken)

    return () => {
      stopEnergyTimer()
    }
  }, [
    bearerToken,
    address,
    enemies,
    gameItems,
    loadOffchainStatic,
    loadTodayDungeonData,
    loadDayProgress,
    loadEnergy,
    stopEnergyTimer,
  ])

  // Fetch current dungeon state on mount
  useEffect(() => {
    if (!bearerToken) return

    async function fetchOnMount() {
      setLocalError('')
      const result = await callGigaverseAction(fetchDungeonStateAction, bearerToken!)
      if (!result.success) {
        setLocalError(result.message || 'Failed to fetch dungeon on mount.')
      } else if (result.data?.entity?.ID_CID) {
        // If we have a dungeon, try to get its name from todayDungeonsMap
        const dungeonId = Number(result.data.entity.ID_CID)
        const dungeonName = todayDungeonsMap[dungeonId]?.NAME_CID ?? `Dungeon #${dungeonId}`
        setCurrentDungeonName(dungeonName)
      }
    }
    fetchOnMount()
  }, [bearerToken, todayDungeonsMap])

  /**
   * Aggregates item changes from the balance history
   */
  const getAggregatedItemChanges = useCallback(() => {
    const map: Record<number, number> = {}
    for (const c of balanceChangesHistory) {
      map[c.id] = (map[c.id] || 0) + c.amount
    }
    return map
  }, [balanceChangesHistory])

  /**
   * Refreshes the current dungeon state
   */
  const refreshDungeon = useCallback(async () => {
    if (!bearerToken) return
    await callGigaverseAction(fetchDungeonStateAction, bearerToken)
  }, [bearerToken])

  /**
   * Checks if the current run is over and refreshes the state
   * @returns true if the run is over, false otherwise
   */
  const checkRunOverAndRefresh = useCallback(async (): Promise<boolean> => {
    const ds = useGigaverseStore.getState().dungeonState
    if (!ds || !ds.run) {
      setAutoPlay(false)
      await refreshDungeon()
      return true
    }
    const ended = ds.run.players[0].health?.current <= 0 || !!ds.entity?.COMPLETE_CID
    if (ended) {
      setAutoPlay(false)

      const roomNum = ds.entity?.ROOM_NUM_CID ?? 1
      const finalEnemies = Math.max(0, roomNum - 1)
      setFinalEnemiesDefeated(finalEnemies)

      const itemChanges = getAggregatedItemChanges()

      // Add run to history
      addRun({
        address: address!,
        username: username!,
        noobId: noobId!,
        dungeonId: ds.entity?.ID_CID ? Number(ds.entity.ID_CID) : 0,
        dungeonName: currentDungeonNameRef.current,
        isJuiced: currentDungeonIsJuicedRef.current,
        enemiesDefeated: finalEnemies,
        timestamp: Date.now(),
        itemChanges,
      })

      await refreshDungeon()
      return true
    }
    return false
  }, [address, username, noobId, getAggregatedItemChanges, refreshDungeon, setAutoPlay, addRun])

  /**
   * Gets the recommended move based on the selected algorithm
   */
  const getRecommendedMove = useCallback((): GigaverseActionType | null => {
    const ds = useGigaverseStore.getState().dungeonState
    if (!ds) return null
    if (selectedAlgorithm === 'manual') return null

    if (selectedAlgorithm === 'random') {
      const possible: GigaverseActionType[] = []
      if (ds.run?.lootPhase && ds.run.lootOptions?.length) {
        // Use correct loot action types based on available options
        const lootActions = [
          GigaverseActionType.PICK_LOOT_ONE,
          GigaverseActionType.PICK_LOOT_TWO,
          GigaverseActionType.PICK_LOOT_THREE,
          GigaverseActionType.PICK_LOOT_FOUR,
        ]

        // Only add available loot options
        for (let i = 0; i < Math.min(ds.run.lootOptions.length, lootActions.length); i++) {
          possible.push(lootActions[i])
        }
      } else {
        possible.push(
          GigaverseActionType.MOVE_ROCK,
          GigaverseActionType.MOVE_PAPER,
          GigaverseActionType.MOVE_SCISSOR
        )
      }
      return possible[Math.floor(Math.random() * possible.length)]
    }

    if (selectedAlgorithm === 'mcts' && mctsRef.current) {
      try {
        if (!ds.run) return null

        const actionData = buildGigaverseRunState(ds, useGameDataStore.getState().enemies)
        return mctsRef.current.pickAction(actionData).type
      } catch (error) {
        console.error('[getRecommendedMove] MCTS error:', error)
        return null
      }
    }

    return null
  }, [selectedAlgorithm])

  /**
   * Handles playing a move in the game
   */
  const handlePlayMove = useCallback(
    async (move: GigaverseActionType) => {
      if (!bearerToken) return

      const prevDs = useGigaverseStore.getState().dungeonState
      if (!prevDs?.run) return

      try {
        const result = await callGigaverseAction(
          playMoveAction,
          bearerToken,
          useGigaverseStore.getState().actionToken,
          Number(prevDs.entity?.ID_CID),
          move
        )

        // Update item balance history
        if (result.gameItemBalanceChanges?.length) {
          setBalanceChangesHistory((prev) => [...prev, ...result.gameItemBalanceChanges!])
        }
      } catch (err) {
        console.error('[Dashboard] handlePlayMove error:', err)
      }
    },
    [bearerToken]
  )

  /**
   * Runs the auto-play chain, executing moves automatically
   */
  const runAutoPlayChain = useCallback(async () => {
    if (isAutoPlayingRef.current) return
    isAutoPlayingRef.current = true

    try {
      let steps = 60 // Safety limit to prevent infinite loops
      while (autoPlayRef.current && steps > 0) {
        if (await checkRunOverAndRefresh()) break
        const move = getRecommendedMove()
        if (!move) break
        await handlePlayMove(move)
        await new Promise((res) => setTimeout(res, 50))
        steps--
      }
      await checkRunOverAndRefresh()
    } catch (error) {
      console.error('[runAutoPlayChain] error:', error)
    } finally {
      isAutoPlayingRef.current = false
    }
  }, [checkRunOverAndRefresh, getRecommendedMove, handlePlayMove])

  /**
   * Handles starting a new dungeon run
   */
  async function handleStartRun(dungeonId: number, isJuiced: boolean) {
    if (!bearerToken) return
    setLocalError('')

    const { actionToken } = useGigaverseStore.getState()
    const result = await callGigaverseAction(
      startRunAction,
      bearerToken,
      actionToken || '',
      dungeonId,
      isJuiced
    )
    if (!result.success) {
      setLocalError(result.message || 'Failed to start run.')
      return
    }

    // Reset run state
    setBalanceChangesHistory([])
    setFinalEnemiesDefeated(0)

    // Set dungeon info
    const dsName = todayDungeonsMap[dungeonId]?.NAME_CID ?? `Dungeon #${dungeonId}`
    setCurrentDungeonName(dsName)
    setCurrentDungeonIsJuiced(isJuiced)

    // Update refs immediately
    currentDungeonNameRef.current = dsName
    currentDungeonIsJuicedRef.current = isJuiced

    // Update run count (normal: +1, juiced: +3)
    incrementRunCount(dungeonId, isJuiced ? 3 : 1)

    // Refresh energy
    await loadEnergy(bearerToken)
  }

  /**
   * Refreshes all game data
   */
  async function refreshAll() {
    if (!bearerToken) return
    setLocalError('')
    try {
      await Promise.all([
        loadEnergy(bearerToken),
        callGigaverseAction(fetchDungeonStateAction, bearerToken),
        loadDayProgress(bearerToken),
        loadTodayDungeonData(bearerToken),
      ])
    } catch (err) {
      console.error('[Dashboard] refreshAll error:', err)
      setLocalError('Failed to refresh all data.')
    }
  }

  // Start auto-play when enabled
  useEffect(() => {
    if (autoPlay && !isAutoPlayingRef.current) {
      runAutoPlayChain()
    }
  }, [autoPlay, runAutoPlayChain])

  // Calculate derived values
  let currentEnergyInt = 0
  let isPlayerJuiced = false
  if (energyData) {
    currentEnergyInt = Math.floor(energyData.energy / 1_000_000_000)
    isPlayerJuiced = energyData.isPlayerJuiced
  }

  // =============================
  // Render
  // =============================
  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <EnergyDisplay energyData={energyData} />
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border border-border bg-card">
          <p className="text-muted-foreground">Loading data from server...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      ) : (
        <>
          {localError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              {localError}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <AlgorithmSelector />

              {dungeonState?.run ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold">Active Run</h2>
                    {selectedAlgorithm !== 'manual' && (
                      <Button
                        variant={autoPlay ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => setAutoPlay(!autoPlay)}
                        className="w-full sm:w-auto"
                      >
                        {autoPlay ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause Auto-Play
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start Auto-Play
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <ActiveRunPanel
                    dungeonState={dungeonState}
                    onPlayMove={handlePlayMove}
                    recommendedMove={getRecommendedMove()}
                  />
                </div>
              ) : (
                <DungeonList
                  dungeons={todayDungeonsMap}
                  dayProgressMap={dayProgressMap}
                  currentEnergy={currentEnergyInt}
                  isPlayerJuiced={isPlayerJuiced}
                  onStartRun={handleStartRun}
                />
              )}
            </div>

            <div className="space-y-6">
              <RunRecapPanel
                changes={balanceChangesHistory}
                dungeonState={dungeonState}
                finalEnemiesDefeated={finalEnemiesDefeated}
              />
              <RunHistoryPanel />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
