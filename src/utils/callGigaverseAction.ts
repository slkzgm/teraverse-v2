// path: src/utils/callGigaverseAction.ts
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { BaseResponse } from '@slkzgm/gigaverse-sdk'

/**
 * A helper to call any server action that may return an actionToken.
 * It updates the store's actionToken automatically if present.
 */
export async function callGigaverseAction<T extends BaseResponse>(
  actionFn: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<T> {
  // Perform the server action
  const result = await actionFn(...args)

  console.log(result)
  // If the response has an actionToken, store it
  if (result.actionToken) {
    useGigaverseStore.getState().setActionToken(result.actionToken)
  }
  if (result.data?.run && result.data?.entity) {
    useGigaverseStore.getState().setDungeonState(result.data)
  }

  return result
}
