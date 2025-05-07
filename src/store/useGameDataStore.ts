// path: src/store/useGameDataStore.ts
'use client'

import { create } from 'zustand'
import { getOffchainStaticAction, getDungeonTodayAction } from '@/actions/gigaverseActions'
import type {
  EnemyEntity,
  OffchainConstants,
  OffchainGameItemEntity,
  RecipeEntity,
  CheckpointEntity,
  TodayDungeonDataEntity,
} from '@slkzgm/gigaverse-sdk'

/**
 * Build item map for quick ID_CID lookups.
 */
function buildItemMap(items: OffchainGameItemEntity[]): Record<number, OffchainGameItemEntity> {
  const map: Record<number, OffchainGameItemEntity> = {}
  for (const item of items) {
    map[item.ID_CID] = item
  }
  return map
}

/**
 * Build "today dungeons" map for quickly referencing daily info (e.g. cost, max runs).
 */
function buildTodayDungeonMap(
  arr: TodayDungeonDataEntity[]
): Record<number, TodayDungeonDataEntity> {
  const map: Record<number, TodayDungeonDataEntity> = {}
  arr.forEach((d) => {
    map[d.ID_CID] = d
  })
  return map
}

interface GameDataState {
  enemies: EnemyEntity[]
  gameItems: OffchainGameItemEntity[]
  recipes: RecipeEntity[]
  checkpoints: CheckpointEntity[]
  constants: OffchainConstants | null

  /**
   * A map of item ID_CID => item details, for O(1) lookups in the UI.
   */
  itemsMap: Record<number, OffchainGameItemEntity>

  /**
   * A map of dungeon ID => today's daily info (energy cost, daily max runs, etc.).
   * This data is relatively static for the day, but can be fetched on refresh or on mount.
   */
  todayDungeonsMap: Record<number, TodayDungeonDataEntity>

  isLoading: boolean
  error: string | null

  /**
   * Load standard offchain static data in one call (enemies, items, etc.).
   */
  loadOffchainStatic: (token: string) => Promise<void>

  /**
   * Load the 'dungeon today' data from the same endpoint used by getDungeonTodayAction,
   * then store only the "dungeonDataEntities" portion in todayDungeonsMap.
   * Typically you'd call this at the same time you update dayProgress in useGigaverseStore.
   */
  loadTodayDungeonData: (token: string) => Promise<void>
}

export const useGameDataStore = create<GameDataState>((set) => ({
  enemies: [],
  gameItems: [],
  recipes: [],
  checkpoints: [],
  constants: null,

  itemsMap: {},
  todayDungeonsMap: {},

  isLoading: false,
  error: null,

  async loadOffchainStatic(token) {
    console.log('[useGameDataStore] loadOffchainStatic => calling getOffchainStaticAction...')
    set({ isLoading: true, error: null })
    try {
      const resp = await getOffchainStaticAction(token)
      set({
        enemies: resp.enemies,
        gameItems: resp.gameItems,
        recipes: resp.recipes,
        checkpoints: resp.checkpoints,
        constants: resp.constants,
        itemsMap: buildItemMap(resp.gameItems),
        isLoading: false,
      })
    } catch (err) {
      console.error('[useGameDataStore] loadOffchainStatic error:', err)
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load offchain data.',
      })
    }
  },

  async loadTodayDungeonData(token) {
    console.log('[useGameDataStore] loadTodayDungeonData => calling getDungeonTodayAction...')
    set({ isLoading: true, error: null })
    try {
      const resp = await getDungeonTodayAction(token)
      const map = buildTodayDungeonMap(resp.dungeonDataEntities)
      set({
        todayDungeonsMap: map,
        isLoading: false,
      })
    } catch (err) {
      console.error('[useGameDataStore] loadTodayDungeonData error:', err)
      set({
        isLoading: false,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to load dungeon daily data (todayDungeonsMap).',
      })
    }
  },
}))
