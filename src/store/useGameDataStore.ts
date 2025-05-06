// path: src/store/useGameDataStore.tsx
'use client'

import { create } from 'zustand'
import { getOffchainStaticAction } from '@/actions/gigaverseActions'
import type {
  EnemyEntity,
  OffchainGameItemEntity,
  OffchainConstants,
  RecipeEntity,
  CheckpointEntity,
} from '@slkzgm/gigaverse-sdk'

/**
 * Helper function to build a lookup map where each key is an item ID_CID
 * and the value is the corresponding item entity.
 * This allows quick O(1) access by ID_CID.
 */
function buildItemMap(items: OffchainGameItemEntity[]): Record<number, OffchainGameItemEntity> {
  const map: Record<number, OffchainGameItemEntity> = {}
  for (const item of items) {
    // Ensure item has an ID_CID before storing
    map[item.ID_CID] = item
  }
  return map
}

interface GameDataState {
  enemies: EnemyEntity[]
  gameItems: OffchainGameItemEntity[]
  recipes: RecipeEntity[]
  checkpoints: CheckpointEntity[]
  constants: OffchainConstants | null

  /**
   * itemsMap provides a direct ID_CID => OffchainGameItemEntity mapping for quick lookup.
   */
  itemsMap: Record<number, OffchainGameItemEntity>

  isLoading: boolean
  error: string | null

  /**
   * Loads offchain static data (enemies, game items, recipes, checkpoints, constants) via a single endpoint.
   */
  loadOffchainStatic: (token: string) => Promise<void>
}

export const useGameDataStore = create<GameDataState>((set) => ({
  enemies: [],
  gameItems: [],
  recipes: [],
  checkpoints: [],
  constants: null,
  itemsMap: {},

  isLoading: false,
  error: null,

  async loadOffchainStatic(token) {
    console.log('[useGameDataStore] Loading offchain static data via server action...')
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
}))
