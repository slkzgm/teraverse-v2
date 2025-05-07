// path: src/actions/gigaverseActions.ts
'use server'

/*
  This file contains all server actions used by our Next.js app.
  We added getEnergyAction to fetch energy state, and also integrated
  the logic for consuming energy in startRunAction, which is performed
  fully on the server side.
*/

import {
  BaseResponse,
  DungeonData,
  GameClient,
  GameItemBalanceChange,
  GetDungeonTodayResponse,
  GetOffchainStaticResponse,
  StartRunPayload,
} from '@slkzgm/gigaverse-sdk'
import {
  GetEnergyResponse,
  GetUserMeResponse,
  GetAllEnemiesResponse,
  GetAllGameItemsResponse,
} from '@slkzgm/gigaverse-sdk/dist/client/types/responses'

function createClient(token: string) {
  return new GameClient('https://gigaverse.io', token)
}

/**
 * Validate token by calling getUserMe and optionally fetch username/noobId
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

    // 1) Verify basic user existence
    const userData: GetUserMeResponse = await client.getUserMe()
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

    // 2) Call getAccount(address) to retrieve the user's noob + usernames, etc.
    let username = ''
    let noobId = ''
    try {
      const accountResp = await client.getAccount(userData.address)

      // Pull first username if available
      if (accountResp.usernames?.length) {
        username = accountResp.usernames[0].NAME_CID
      }

      // Check if a noob is present
      if (accountResp.noob) {
        noobId = accountResp.noob.docId
      } else {
        // Means user does not have a noob => cannot play
        return {
          success: false,
          address: userData.address,
          canEnterGame: false,
          message: 'No noob found. Acquire one first.',
          error: 'User has no noobs in their account',
        }
      }
    } catch (fetchErr) {
      console.warn('[validateTokenAction] Could not fetch account data:', fetchErr)
      return {
        success: true,
        address: userData.address,
        username: '',
        noobId: '',
        canEnterGame: true,
        message: 'Some user data not fetched, but user can access.',
        error: 'Failed to fetch user details (getAccount)',
      }
    }

    return {
      success: true,
      address: userData.address,
      username,
      noobId,
      canEnterGame: true,
      message: 'Token validated successfully',
    }
  } catch (err: unknown) {
    console.error('[validateTokenAction] Error:', err)
    return {
      success: false,
      message: 'Validation failed or token invalid.',
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    }
  }
}

/**
 * Wallet-based auth
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
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    }
  }
}

/**
 * Fetch dungeon state
 */
export async function fetchDungeonState(token: string): Promise<{
  success: boolean
  data: DungeonData | null
  message?: string
  error?: string
}> {
  console.log('[fetchDungeonState] Fetching dungeon state...')
  try {
    const client = createClient(token)
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
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    }
  }
}

/**
 * Start a run. This consumes energy on the server side depending on the mode.
 */
export async function startRunAction(
  token: string,
  actionToken = '',
  dungeonId: number,
  isJuiced = false
): Promise<{
  success: boolean
  data: DungeonData | null
  actionToken?: string | number
  message?: string
  error?: string
}> {
  console.log('[startRunAction] Starting run, dungeonId:', dungeonId)
  try {
    const client = createClient(token)
    const payload: StartRunPayload = {
      actionToken,
      dungeonId,
      data: {
        isJuiced,
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

/**
 * Play a move in the currently active run
 */
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
    console.log('[playMove] Attempting move:', move)
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

    return {
      success: true,
      data,
      message: 'Move played',
      actionToken: newActionToken,
      gameItemBalanceChanges: gameItemBalanceChanges ?? null,
    }
  } catch (err: unknown) {
    console.error('[playMove] Error:', err)
    return {
      success: false,
      data: null,
      message: 'Failed to play move',
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    }
  }
}

/**
 * Fetch energy
 */
export async function getEnergyAction(
  token: string,
  address: string
): Promise<GetEnergyResponse & BaseResponse> {
  console.log('[getEnergyAction] Fetching energy data...')
  const client = createClient(token)
  return client.getEnergy(address)
}

/**
 * Fetches offchain static data (enemies, recipes, game items, checkpoints, constants) from a single endpoint.
 */
export async function getOffchainStaticAction(token: string): Promise<GetOffchainStaticResponse> {
  console.log('[getOffchainStaticAction] Requesting offchain static data from server...')
  const client = createClient(token)
  return client.getOffchainStatic()
}

/**
 * Fetches today's dungeon progress, including day-progress data (number of runs used)
 * and today's dungeon metadata (energy cost, max runs, etc.).
 */
export async function getDungeonTodayAction(token: string): Promise<GetDungeonTodayResponse> {
  console.log('[getDungeonTodayAction] Requesting /api/game/dungeon/today...')
  const client = createClient(token)
  return client.getDungeonToday()
}
