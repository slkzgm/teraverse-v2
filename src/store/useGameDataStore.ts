// path: src/store/useGameDataStore.ts
'use client'

import { create } from 'zustand'
import { EnemyEntity, GameItemEntity } from '@slkzgm/gigaverse-sdk/dist/client/types/game'
import { getAllEnemiesAction, getAllGameItemsAction } from '@/actions/gigaverseActions'

interface GameDataState {
  enemies: EnemyEntity[]
  items: GameItemEntity[]
  isLoading: boolean
  error: string | null

  loadEnemies: (token: string) => Promise<void>
  loadItems: (token: string) => Promise<void>
}

/**
 * A Zustand store for dynamic game data (enemies, items, etc.).
 * We'll fetch them via server actions from gigaverseActions.ts,
 * then store in-memory here for our Next.js components to use.
 */
export const useGameDataStore = create<GameDataState>((set) => ({
  enemies: [],
  items: [],
  isLoading: false,
  error: null,

  // Example method to load enemies
  loadEnemies: async (token) => {
    console.log('[useGameDataStore] Loading enemies via server action...')
    set({ isLoading: true, error: null })
    try {
      const resp = await getAllEnemiesAction(token)
      // Suppose getAllEnemiesAction returns { entities: EnemyEntity[] }
      set({ enemies: resp.entities, isLoading: false })
    } catch (err) {
      console.error('[useGameDataStore] loadEnemies error:', err)
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load enemies',
      })
    }
  },

  // Example method to load items
  loadItems: async (token) => {
    console.log('[useGameDataStore] Loading items via server action...')
    set({ isLoading: true, error: null })
    try {
      const resp = await getAllGameItemsAction(token)
      // Suppose getAllGameItemsAction returns { entities: GameItemEntity[] }
      set({ items: resp.entities, isLoading: false })
    } catch (err) {
      console.error('[useGameDataStore] loadItems error:', err)
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load items',
      })
    }
  },
}))
