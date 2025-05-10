// path: src/app/(dashboard)/_components/dashboard-header.tsx
'use client'

import React from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import ThemeSwitcher from '@/components/theme-switcher'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function DashboardHeader() {
  const { clearAuthData } = useAuthStore()
  const { username, address, noobId, clearUserData } = useGigaverseStore()

  const handleLogout = () => {
    clearUserData()
    clearAuthData()
  }

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="relative h-8 w-8">
          <Image src="/images/logo.png" alt="Teraverse Logo" fill className="object-contain" />
        </div>
        <div className="flex items-center">
          <h1 className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text font-title text-2xl font-bold tracking-wider text-transparent">
            TERAVERSE
          </h1>
          <div className="ml-2 hidden h-8 items-center sm:flex">
            <div className="mx-2 h-5 border-l border-border" />
            <span className="text-sm text-muted-foreground">
              by{' '}
              <a
                href="https://github.com/slkzgm"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <span className="font-semibold text-primary">SLK</span>
              </a>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{username || 'User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Username</span>
              <span className="font-medium">{username || 'Not available'}</span>
            </DropdownMenuItem>
            {address && (
              <DropdownMenuItem className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">Wallet</span>
                <span className="font-mono text-xs font-medium">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </DropdownMenuItem>
            )}
            {noobId && (
              <DropdownMenuItem className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">Noob ID</span>
                <span className="font-medium">{noobId}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
