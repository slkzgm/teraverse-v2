// path: src/utils/callGigaverseAction.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGigaverseStore } from '@/store/useGigaverseStore'

/**
 * Generic wrapper for calling a Gigaverse action, preserving full response type
 * including any extra fields (e.g., gameItemBalanceChanges).
 */
export async function callGigaverseAction<F extends (...args: any[]) => Promise<any>>(
  actionFn: F,
  ...args: Parameters<F>
): Promise<Awaited<ReturnType<F>>> {
  const result = await actionFn(...args)
  console.log('[callGigaverseAction] Received result:', result)

  // If there's an actionToken on the result, update store
  if ('actionToken' in result) {
    useGigaverseStore.getState().setActionToken((result as any).actionToken)
  }

  // If data is present, update dungeonState
  if ('data' in result) {
    const d = (result as any).data
    if (typeof d === 'object' && d !== null && 'run' in d && 'entity' in d) {
      const run = (d as any).run
      const entity = (d as any).entity
      if (run == null && entity == null) {
        useGigaverseStore.getState().setDungeonState(null)
      } else {
        useGigaverseStore.getState().setDungeonState(structuredClone(d))
      }
    }
  }

  return result as Awaited<ReturnType<F>>
}
