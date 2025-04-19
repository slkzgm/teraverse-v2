// path: src/app/dashboard/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateTokenAction, fetchDungeonState, playMove } from '@/actions/gigaverseActions'
import { callGigaverseAction } from '@/utils/callGigaverseAction'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'

/**
 * A dashboard page that:
 * 1) Validates the bearer token on mount (redirects to / if invalid/expired).
 * 2) Provides buttons to fetch dungeon data & play moves.
 * 3) Automatically updates the store’s dungeonState and actionToken via callGigaverseAction().
 */
export default function DashboardPage() {
  const router = useRouter()
  const { bearerToken, expiresAt } = useAuthStore()

  const { address, username, noobId, actionToken, dungeonState } = useGigaverseStore()

  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState('')

  // Validate the user's token on mount, or redirect them if invalid/expired
  useEffect(() => {
    async function checkAccess() {
      if (!bearerToken || (expiresAt && Date.now() > expiresAt)) {
        console.log('[Dashboard] Token missing or expired. Redirecting to /...')
        router.push('/')
        return
      }
      try {
        const result = await validateTokenAction(bearerToken)
        if (!result.success || !result.canEnterGame || !result.address) {
          console.log('[Dashboard] Token invalid or no access. Redirecting to /...')
          router.push('/')
        } else {
          console.log('[Dashboard] Token is valid. User can stay on dashboard.')
        }
      } catch (err) {
        console.error('[Dashboard] Error validating token:', err)
        router.push('/')
      } finally {
        setIsChecking(false)
      }
    }
    checkAccess()
  }, [bearerToken, expiresAt, router])

  // 1) Fetch dungeon state (automatically stored in gigaverseStore via callGigaverseAction)
  async function handleFetchDungeon() {
    setError('')
    if (!bearerToken) {
      setError('No bearer token. Please re-login.')
      return
    }
    try {
      const result = await callGigaverseAction(fetchDungeonState, bearerToken)
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch dungeon.')
      }
    } catch (err: unknown) {
      console.error('[Dashboard] handleFetchDungeon error:', err)
      setError(err instanceof Error ? err.message : 'Unexpected error fetching dungeon.')
    }
  }

  // 2) Play a move (automatically stores updated dungeonState and actionToken if present)
  async function handlePlayMove(
    move: 'rock' | 'paper' | 'scissor' | 'loot_one' | 'loot_two' | 'loot_three'
  ) {
    setError('')
    if (!bearerToken) {
      setError('No bearer token. Please re-login.')
      return
    }
    const dungeonId = 123 // example ID; replace with real dungeon ID if needed

    try {
      const result = await callGigaverseAction(playMove, bearerToken, actionToken, dungeonId, move)
      if (!result.success) {
        throw new Error(result.message || 'Failed to play move.')
      }
    } catch (err: unknown) {
      console.error('[Dashboard] handlePlayMove error:', err)
      setError(err instanceof Error ? err.message : 'Unexpected error playing move.')
    }
  }

  if (isChecking) {
    return <p>Checking your session...</p>
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <p>Address: {address}</p>
      <p>Username: {username}</p>
      <p>Noob ID: {noobId}</p>

      <button onClick={handleFetchDungeon}>Fetch Dungeon State</button>

      {dungeonState && (
        <section style={{ marginTop: 20 }}>
          <h2>Current Dungeon State</h2>
          <p>
            <strong>Run ID:</strong> {dungeonState.run?.runId}
          </p>
          <p>
            <strong>Entity ID:</strong> {dungeonState.entity?.docId}
          </p>

          <div style={{ marginTop: 10 }}>
            <h3>Play a Move</h3>
            <button onClick={() => handlePlayMove('rock')}>Rock</button>
            <button onClick={() => handlePlayMove('paper')}>Paper</button>
            <button onClick={() => handlePlayMove('scissor')}>Scissor</button>
            <button onClick={() => handlePlayMove('loot_one')}>Loot One</button>
            <button onClick={() => handlePlayMove('loot_two')}>Loot Two</button>
            <button onClick={() => handlePlayMove('loot_three')}>Loot Three</button>
          </div>
        </section>
      )}
    </main>
  )
}
