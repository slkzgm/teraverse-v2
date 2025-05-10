// path: src/utils/callGigaverseAction.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGigaverseStore } from '@/store/useGigaverseStore'

export async function callGigaverseAction<F extends (...args: any[]) => Promise<any>>(
  actionFn: F,
  ...args: Parameters<F>
): Promise<Awaited<ReturnType<F>>> {
  const result = await actionFn(...args)

  if ('actionToken' in result) {
    useGigaverseStore.getState().setActionToken(result.actionToken)
  }

  if ('data' in result) {
    const d = (result as any).data
    if (typeof d === 'object' && d !== null && 'run' in d && 'entity' in d) {
      if (!d.run && !d.entity) {
        useGigaverseStore.getState().setDungeonState(null)
      } else {
        useGigaverseStore.getState().setDungeonState(structuredClone(d))
      }
    }
  }

  return result as Awaited<ReturnType<F>>
}
