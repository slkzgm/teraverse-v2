// path: src/utils/callGigaverseAction.ts
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { BaseResponse } from '@slkzgm/gigaverse-sdk'

export async function callGigaverseAction<T extends BaseResponse>(
  actionFn: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<T> {
  const result = await actionFn(...args)
  console.log('[callGigaverseAction] Received result:', result)

  // 1) If there's a new actionToken, store it
  if (result.actionToken) {
    useGigaverseStore.getState().setActionToken(result.actionToken)
  }

  // 2) If data is returned, handle the run/entity logic carefully
  if (result.data) {
    // If run=null && entity=null => means no active run => set store to null
    if (result.data.run === null && result.data.entity === null) {
      console.log('[callGigaverseAction] No active run => setting dungeonState to null')
      useGigaverseStore.getState().setDungeonState(null)
    } else {
      // Otherwise store the new data in the dungeonState
      // If you want to ensure a fresh reference, do structuredClone
      const clonedData = structuredClone(result.data)
      useGigaverseStore.getState().setDungeonState(clonedData)
    }
  }

  return result
}
