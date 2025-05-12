// path: src/actions/gigaverseActions.ts

'use server'

import {
  BaseResponse,
  DungeonData,
  GameClient,
  GameItemBalanceChange,
  GetDungeonTodayResponse,
  GetOffchainStaticResponse,
  StartRunPayload,
  GetUserRomsResponse,
  ClaimRomPayload,
  ClaimRomResponse,
} from '@slkzgm/gigaverse-sdk'
import {
  GetEnergyResponse,
  GetUserMeResponse,
} from '@slkzgm/gigaverse-sdk/dist/client/types/responses'
import { GigaverseActionType } from '@slkzgm/gigaverse-engine'

function createClient(token: string) {
  return new GameClient('https://gigaverse.io', token)
}

export async function validateTokenAction(token: string): Promise<{
  success: boolean
  address?: string
  username?: string
  noobId?: string
  canEnterGame?: boolean
  message?: string
  error?: string
}> {
  try {
    if (!token || token.trim() === '') {
      return {
        success: false,
        message: 'Please provide a valid authentication token',
        error: 'No token provided',
      }
    }

    const client = createClient(token)
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

    let username = ''
    let noobId = ''

    try {
      const accountResp = await client.getAccount(userData.address)
      if (accountResp.usernames?.length) {
        username = accountResp.usernames[0].NAME_CID
      }
      if (accountResp.noob) {
        noobId = accountResp.noob.docId
      } else {
        return {
          success: false,
          address: userData.address,
          canEnterGame: false,
          message: 'No noob found. Acquire one first.',
          error: 'User has no noobs in their account',
        }
      }
    } catch (fetchErr) {
      // Partial success
      return {
        success: true,
        address: userData.address,
        username: '',
        noobId: '',
        canEnterGame: true,
        message: 'Some user data not fetched, but user can access.',
        error: `Failed to fetch user details (getAccount): ${JSON.stringify(fetchErr)}`,
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

export async function fetchDungeonStateAction(token: string): Promise<{
  success: boolean
  data: DungeonData | null
  message?: string
  error?: string
}> {
  try {
    const client = createClient(token)
    const { data } = await client.fetchDungeonState()
    return {
      success: true,
      data,
      message: 'Dungeon state fetched',
    }
  } catch (err: unknown) {
    console.error('[fetchDungeonStateAction] Error:', err)
    return {
      success: false,
      data: null,
      message: 'Failed to fetch dungeon state',
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    }
  }
}

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

export async function playMoveAction(
  token: string,
  actionToken: string | null,
  dungeonId: number,
  move: GigaverseActionType
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
      dungeonId,
    })

    return {
      success: true,
      data,
      message: 'Move played',
      actionToken: newActionToken,
      gameItemBalanceChanges: gameItemBalanceChanges ?? null,
    }
  } catch (err: unknown) {
    console.error('[playMoveAction] Error:', err)
    return {
      success: false,
      data: null,
      message: 'Failed to play move',
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    }
  }
}

export async function getEnergyAction(token: string, address: string): Promise<GetEnergyResponse> {
  const client = createClient(token)
  return client.getEnergy(address)
}

export async function getOffchainStaticAction(token: string): Promise<GetOffchainStaticResponse> {
  const client = createClient(token)
  return client.getOffchainStatic()
}

export async function getDungeonTodayAction(token: string): Promise<GetDungeonTodayResponse> {
  const client = createClient(token)
  return client.getDungeonToday()
}

/**
 * Retrieves all ROMs associated with the given address.
 */
export async function getUserRoms(token: string, address: string): Promise<GetUserRomsResponse> {
  console.info(`[gigaverseActions] Fetching user ROMs for address: ${address}`)
  const client = createClient(token)
  const response = await client.getUserRoms(address)
  return response
}

/**
 * Claims a resource (e.g. "energy", "shard", "dust") for a specific ROM.
 */
export async function claimRom(token: string, payload: ClaimRomPayload): Promise<ClaimRomResponse> {
  console.info(
    `[gigaverseActions] Claiming resource for ROM: ${payload.romId} -> ${payload.claimId}`
  )
  const client = createClient(token)
  const response = await client.claimRom(payload)
  console.info(`[gigaverseActions] Claim result => success: ${response.success}`)
  return response
}
