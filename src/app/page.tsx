// path: src/app/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useSignMessage } from 'wagmi'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { validateTokenAction, authenticateWithSignature } from '@/actions/gigaverseActions'
import { useLoginWithAbstract } from '@abstract-foundation/agw-react'

export default function HomePage() {
  const router = useRouter()
  const { hasHydrated, bearerToken, expiresAt, setAuthData } = useAuthStore()
  const { setUserData, clearUserData } = useGigaverseStore()
  const { isConnected, address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { login } = useLoginWithAbstract()

  // Redirect to dashboard if token is still valid
  useEffect(() => {
    if (!hasHydrated) return
    if (bearerToken && expiresAt && Date.now() < expiresAt) {
      router.replace('/dashboard')
    }
  }, [hasHydrated, bearerToken, expiresAt, router])

  const [authTokenInput, setAuthTokenInput] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Handle login with bearer token
  async function handleBearerSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!authTokenInput.trim()) {
      setError('Please provide a valid Bearer token.')
      return
    }
    setIsLoading(true)
    try {
      const result = await validateTokenAction(authTokenInput)
      if (!result.success || !result.address || !result.canEnterGame) {
        throw new Error(result.message || 'Invalid token or cannot access game.')
      }
      const oneHourLater = Date.now() + 60 * 60 * 1000
      setAuthData(authTokenInput, oneHourLater)
      setUserData(result.address, result.username ?? '', result.noobId ?? '')
      router.push('/dashboard')
    } catch (err) {
      console.error('[HomePage] Bearer login error:', err)
      setError(err instanceof Error ? err.message : 'Bearer token validation failed.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle login with wallet signature
  async function handleWalletLogin() {
    setError('')
    if (!isConnected) {
      await login()
      return
    }
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
      const validation = await validateTokenAction(authResult.bearerToken)
      if (!validation.success || !validation.address || !validation.canEnterGame) {
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

  // Clear stored authentication
  function handleDisconnect() {
    clearUserData()
    setAuthData('', 0)
    setAuthTokenInput('')
    setError('')
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Teraverse Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleBearerSubmit} style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Bearer token..."
          value={authTokenInput}
          onChange={(e) => setAuthTokenInput(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Verifying...' : 'Connect with Token'}
        </button>
      </form>

      <button onClick={handleWalletLogin} disabled={isLoading} style={{ marginRight: 8 }}>
        {isLoading ? 'Processing...' : !isConnected ? 'Connect Wallet' : 'Sign Message to Login'}
      </button>
      <button onClick={handleDisconnect} disabled={isLoading}>
        Disconnect / Clear
      </button>
    </main>
  )
}
