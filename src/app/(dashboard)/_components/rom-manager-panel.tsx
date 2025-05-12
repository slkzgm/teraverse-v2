// path: src/app/(dashboard)/_components/rom-manager-panel.tsx

'use client'

import React, { useEffect, useState } from 'react'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Package, Zap, Cloud, RefreshCw, CheckCircle } from 'lucide-react'

export function RomManagerPanel() {
  const {
    address,
    romEntities,
    fetchUserRoms,
    getTotalDustCollectable,
    getTotalShardCollectable,
    getTotalEnergyCollectable,
    loadEnergy,
    claimResourceForAll,
  } = useGigaverseStore()

  const { bearerToken } = useAuthStore()

  const [isLoadingDust, setIsLoadingDust] = useState(false)
  const [isLoadingShard, setIsLoadingShard] = useState(false)
  const [isLoadingEnergy, setIsLoadingEnergy] = useState(false)
  const [claimedType, setClaimedType] = useState<string | null>(null)

  useEffect(() => {
    if (!bearerToken || !address) return
    fetchUserRoms(bearerToken, address)
  }, [bearerToken, address, fetchUserRoms])

  const totalDust = getTotalDustCollectable()
  const totalShard = getTotalShardCollectable()
  const totalEnergy = getTotalEnergyCollectable()

  async function refreshEverything(refreshEnergy?: boolean) {
    if (!bearerToken || !address) return
    await fetchUserRoms(bearerToken, address)
    if (refreshEnergy) await loadEnergy(bearerToken)
  }

  async function handleClaim(type: 'dust' | 'shard' | 'energy') {
    if (!bearerToken || !address) return

    const loadingSetters = {
      dust: setIsLoadingDust,
      shard: setIsLoadingShard,
      energy: setIsLoadingEnergy,
    }

    try {
      loadingSetters[type](true)
      await claimResourceForAll(bearerToken, address, type)

      setClaimedType(type)
      setTimeout(() => setClaimedType(null), 1000)
    } finally {
      loadingSetters[type](false)
    }
  }

  async function handleRefreshAll() {
    await refreshEverything(true)
  }

  const isAnyClaimLoading = isLoadingDust || isLoadingShard || isLoadingEnergy

  const getButtonContent = (type: string, isLoading: boolean) => {
    if (isLoading) return `Claiming ${type.charAt(0).toUpperCase() + type.slice(1)}...`
    if (claimedType === type)
      return (
        <>
          <CheckCircle className="mr-1 h-4 w-4 text-green-500" /> Claimed!
        </>
      )
    return `Claim ${type.charAt(0).toUpperCase() + type.slice(1)}`
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Cloud className="h-5 w-5" />
          ROM Manager
        </h2>
        <Button variant="outline" size="sm" onClick={handleRefreshAll}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="mb-3 space-y-2 text-sm text-muted-foreground">
        <p>Owned ROMs: {romEntities.length}</p>
        <p className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Dust: <span className="font-medium">{totalDust}</span>
        </p>
        <p className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Shard: <span className="font-medium">{totalShard}</span>
        </p>
        <p className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Energy: <span className="font-medium">{totalEnergy}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => handleClaim('dust')}
          disabled={isAnyClaimLoading}
          className="flex-1 sm:flex-auto"
        >
          {getButtonContent('dust', isLoadingDust)}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleClaim('shard')}
          disabled={isAnyClaimLoading}
          className="flex-1 sm:flex-auto"
        >
          {getButtonContent('shard', isLoadingShard)}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleClaim('energy')}
          disabled={isAnyClaimLoading}
          className="flex-1 sm:flex-auto"
        >
          {getButtonContent('energy', isLoadingEnergy)}
        </Button>
      </div>
    </div>
  )
}
