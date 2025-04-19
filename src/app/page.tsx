// path: src/app/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useSignMessage } from 'wagmi'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { validateTokenAction, authenticateWithSignature } from '@/actions/gigaverseActions'
import { useLoginWithAbstract } from '@abstract-foundation/agw-react'

export default function HomePage() {
  const router = useRouter()

  // Wagmi states
  const { isConnected, address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  // Abstract wallet login / logout
  const { login } = useLoginWithAbstract()

  // Zustand stores
  const { setAuthData, clearAuthData } = useAuthStore()
  const { setUserData, clearUserData } = useGigaverseStore()

  // Local states
  const [tokenInput, setTokenInput] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /**
   * 1) Bearer token flow
   *    - Calls validateTokenAction
   *    - If success => store in AuthStore => redirect
   *    - If no expiresAt from server => default 1 hour
   */
  async function handleBearerSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!tokenInput.trim()) {
      setError('Please provide a valid Bearer token.')
      return
    }

    setIsLoading(true)
    try {
      const result = await validateTokenAction(tokenInput)
      if (!result.success || !result.address || !result.canEnterGame) {
        throw new Error(result.message || 'Invalid token or cannot access game.')
      }
      const oneHourLater = Date.now() + 60 * 60 * 1000
      setAuthData(tokenInput, oneHourLater)
      setUserData(result.address, result.username ?? '', result.noobId ?? '')

      router.push('/dashboard')
    } catch (err) {
      console.error('[HomePage] Bearer login error:', err)
      setError(err instanceof Error ? err.message : 'Bearer token validation failed.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 2) Wallet connect + signature flow (unified in one button):
   *    - If user is not connected, call login()
   *    - If user is connected, do the sign => authenticate => validate => store => redirect
   */
  async function handleWalletLogin() {
    setError('')
    if (!isConnected) {
      console.log('[HomePage] Wallet is not connected. Triggering login().')
      await login()
      return
    }

    // If already connected, proceed with signature + authentication
    setIsLoading(true)
    try {
      if (!address) {
        throw new Error('No wallet address found.')
      }
      const timestamp = Date.now()
      const message = `Login to Gigaverse at ${timestamp}`
      const signature = await signMessageAsync({ message })

      const authResult = await authenticateWithSignature(address, signature, message, timestamp)
      if (!authResult.success || !authResult.bearerToken) {
        throw new Error(authResult.message || 'Signature authentication failed.')
      }

      // Validate the token to ensure canEnterGame & fetch user data
      const validation = await validateTokenAction(authResult.bearerToken)
      if (!validation.success || !validation.canEnterGame || !validation.address) {
        throw new Error(validation.message || 'Authenticated token is invalid or no game access.')
      }

      const finalExpiresAt = authResult.expiresAt ?? Date.now() + 60 * 60 * 1000
      setAuthData(authResult.bearerToken, finalExpiresAt)
      setUserData(validation.address, validation.username ?? '', validation.noobId ?? '')

      router.push('/dashboard')
    } catch (err) {
      console.error('[HomePage] Wallet login error:', err)
      setError(err instanceof Error ? err.message : 'Wallet login or signature failed.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleDisconnect() {
    clearAuthData()
    clearUserData()
    setTokenInput('')
    setError('')
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Teraverse Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Bearer token form */}
      <form onSubmit={handleBearerSubmit} style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Bearer token..."
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Connect with Token'}
        </button>
      </form>

      {/* Single wallet button: if not connected => login(); if connected => signature flow */}
      <button onClick={handleWalletLogin} disabled={isLoading}>
        {isLoading ? 'Processing...' : !isConnected ? 'Connect Wallet' : 'Sign Message to Login'}
      </button>

      <div style={{ marginTop: 10 }}>
        <button onClick={handleDisconnect}>Disconnect / Clear</button>
      </div>
    </main>
  )
}
