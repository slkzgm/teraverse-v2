// path: src/actions/gigaverseActions.ts
'use server'

import {
  BaseResponse,
  DungeonData,
  GameClient,
  GameItemBalanceChange,
  StartRunPayload,
} from '@slkzgm/gigaverse-sdk'

function createClient(token: string) {
  return new GameClient('https://gigaverse.io', token)
}

/**
 * Server action: validateTokenAction
 * - Calls getUserMe internally to verify the token and check canEnterGame.
 * - If valid, also fetches additional data (username, noobId).
 * - Returns a uniform response shape: success, message, error, plus user data if success = true.
 */
export async function validateTokenAction(token: string): Promise<{
  success: boolean
  address?: string
  username?: string
  noobId?: string
  canEnterGame?: boolean
  message?: string
  error?: string
}> {
  console.log('[validateTokenAction] Validating token...')
  try {
    if (!token || token.trim() === '') {
      return {
        success: false,
        message: 'Please provide a valid authentication token',
        error: 'No token provided',
      }
    }

    const client = createClient(token)
    const userData = await client.getUserMe()
    if (!userData || !userData.address) {
      return {
        success: false,
        message: 'Invalid token. No valid user found.',
        error: 'getUserMe() returned no address',
      }
    }

    if (!userData.canEnterGame) {
      return {
        success: false,
        address: userData.address,
        canEnterGame: false,
        message: 'Cannot enter. Must own a noob.',
        error: 'User has no access to the game',
      }
    }

    // Attempt to fetch username & noobId
    let username = ''
    let noobId = ''
    try {
      const names = await client.getUsernames(userData.address)
      if (names?.entities?.length) {
        username = names.entities[0].NAME_CID
      }
      const noobs = await client.getNoobs(userData.address)
      if (noobs?.entities?.length) {
        noobId = noobs.entities[0].docId
      } else {
        return {
          success: false,
          address: userData.address,
          canEnterGame: false,
          message: 'No noob found. Acquire one first.',
          error: 'User has no noobs in their wallet',
        }
      }
    } catch (fetchErr) {
      console.warn('[validateTokenAction] Could not fetch extra user data:', fetchErr)
      return {
        success: true,
        address: userData.address,
        username: '',
        noobId: '',
        canEnterGame: true,
        message: 'Some user data not fetched, but user can access.',
        error: 'Failed to fetch username or noob data',
      }
    }

    // If we get here, token + user info are valid
    return {
      success: true,
      address: userData.address,
      username,
      noobId,
      canEnterGame: true,
      message: 'Token validated successfully',
    }
  } catch (requestError: unknown) {
    console.error('[validateTokenAction] Error:', requestError)
    return {
      success: false,
      message: 'Validation failed or token invalid.',
      error:
        requestError instanceof Error
          ? requestError.message
          : 'Unknown error occurred while validating token',
    }
  }
}

/**
 * Server action: authenticateWithSignature
 * - Calls the Gigaverse endpoint for wallet-based authentication.
 * - Returns a Bearer token plus optional expiresAt, using a uniform shape with success, message, error.
 */
export async function authenticateWithSignature(
  walletAddress: string,
  signature: string,
  message: string,
  timestamp: number
): Promise<{
  success: boolean
  bearerToken?: string
  expiresAt?: number
  message?: string
  error?: string
}> {
  console.log('[authenticateWithSignature] Authenticating signature...')
  try {
    const response = await fetch('https://gigaverse.io/api/user/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
      body: JSON.stringify({ signature, address: walletAddress, message, timestamp }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        message: errorData.message || 'Authentication failed',
        error: 'Non-OK status from Gigaverse auth endpoint',
      }
    }

    const authData = await response.json()
    return {
      success: true,
      bearerToken: authData.jwt,
      expiresAt: authData.expiresAt,
      message: 'Wallet signature authenticated',
    }
  } catch (err: unknown) {
    console.error('[authenticateWithSignature] Error:', err)
    return {
      success: false,
      message: 'Failed to authenticate with Gigaverse',
      error: err instanceof Error ? err.message : 'Unknown error occurred in fetch',
    }
  }
}

export async function fetchDungeonState(token: string): Promise<{
  success: boolean
  data: DungeonData | null
  message?: string
  error?: string
}> {
  console.log('[fetchDungeonState] Fetching dungeon state...')
  try {
    const client = await createClient(token)
    const { data } = await client.fetchDungeonState()

    return {
      success: true,
      data,
      message: 'Dungeon state fetched',
    }
  } catch (err: unknown) {
    console.error('[fetchDungeonState] Error:', err)
    return {
      success: false,
      data: null,
      message: 'Failed to fetch dungeon state',
      error: err instanceof Error ? err.message : 'Unknown error occurred in fetchDungeon',
    }
  }
}

export async function startRunAction(
  token: string,
  dungeonId: number
): Promise<{
  success: boolean
  data: DungeonData | null
  actionToken?: string | number
  message?: string
  error?: string
}> {
  console.log('[startRunAction] Starting run for dungeonId:', dungeonId)
  try {
    const client = createClient(token)

    const payload: StartRunPayload = {
      actionToken: '',
      dungeonId,
      data: {
        consumables: [],
        itemId: 0,
        index: 0,
      },
    }

    const result: BaseResponse = await client.startRun(payload)
    if (!result.success) {
      return {
        success: false,
        data: null,
        actionToken: result.actionToken,
        message: result.message || 'Run failed to start',
        error: 'Server responded with success=false',
      }
    }

    return {
      success: true,
      data: (result.data as DungeonData) || null,
      actionToken: result.actionToken,
      message: result.message,
    }
  } catch (err: unknown) {
    console.error('[startRunAction] Error:', err)
    return {
      success: false,
      data: null,
      message: 'Failed to start run',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function playMove(
  token: string,
  actionToken: string | null,
  dungeonId: number,
  move: 'rock' | 'paper' | 'scissor' | 'loot_one' | 'loot_two' | 'loot_three'
): Promise<{
  success: boolean
  data: DungeonData | null
  actionToken?: string | number
  gameItemBalanceChanges?: GameItemBalanceChange[] | null
  message?: string
  error?: string
}> {
  try {
    const client = createClient(token)
    console.log(`[PlayMove] ${move}, ${token}, ${actionToken}, ${dungeonId}`)
    const {
      actionToken: newActionToken,
      data,
      gameItemBalanceChanges,
    } = await client.playMove({
      action: move,
      actionToken: actionToken || '',
      data: {
        consumables: [],
        itemId: 0,
        index: 0,
        gearInstanceIds: [],
      },
      dungeonId: dungeonId,
    })

    const balanceChanges = gameItemBalanceChanges ?? null

    return {
      success: true,
      data,
      message: 'Move played',
      actionToken: newActionToken,
      gameItemBalanceChanges: balanceChanges,
    }
  } catch (err: unknown) {
    console.error('[playMove] Error:', err)
    return {
      success: false,
      data: null,
      message: 'Failed to play move',
      error: err instanceof Error ? err.message : 'Unknown error occurred in playMove',
    }
  }
}

export async function getAllEnemiesAction(token: string) {
  const client = createClient(token)
  return client.getAllEnemies()
}

export async function getAllGameItemsAction(token: string) {
  const client = createClient(token)
  return client.getAllGameItems()
}
