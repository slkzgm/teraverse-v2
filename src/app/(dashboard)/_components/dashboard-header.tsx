'use client'

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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <span className="font-bold text-primary-foreground">T</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Teraverse</h1>
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
