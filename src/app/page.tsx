'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useSignMessage } from 'wagmi'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { validateTokenAction, authenticateWithSignature } from '@/actions/gigaverseActions'
import { useLoginWithAbstract } from '@abstract-foundation/agw-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wallet, Key, AlertCircle, Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { hasHydrated, bearerToken, expiresAt, setAuthData } = useAuthStore()
  const { setUserData } = useGigaverseStore()
  const { isConnected, address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { login, logout } = useLoginWithAbstract()

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

  // Clear stored authentication and disconnect wallet if connected
  function handleDisconnect() {
    if (isConnected) {
      logout()
    }
    setAuthTokenInput('')
    setError('')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">T</span>
          </div>
          <h1 className="text-3xl font-bold">Teraverse</h1>
          <p className="mt-2 text-muted-foreground">Enhanced Gameplay for Gigaverse</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-6">
          <form onSubmit={handleBearerSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium">
                Bearer Token
              </label>
              <Input
                id="token"
                type="text"
                placeholder="Enter your bearer token..."
                value={authTokenInput}
                onChange={(e) => setAuthTokenInput(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Connect with Token
                </>
              )}
            </Button>
          </form>

          <div className="my-4 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="mx-2 text-xs text-muted-foreground">OR</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          <Button
            variant="outline"
            onClick={handleWalletLogin}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : !isConnected ? (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Sign Message to Login
              </>
            )}
          </Button>

          {isConnected && (
            <Button
              variant="ghost"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="mt-2 w-full text-muted-foreground"
            >
              Disconnect Wallet
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
