// path: src/components/sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  History,
  Settings,
  Dices,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { useGigaverseStore } from '@/store/useGigaverseStore'
import ThemeSwitcher from './theme-switcher'
import { Button } from './ui/button'

export function Sidebar() {
  const pathname = usePathname()
  const { clearAuthData } = useAuthStore()
  const { username, clearUserData } = useGigaverseStore()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Détecter si l'écran est mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)

    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  const handleLogout = () => {
    clearUserData()
    clearAuthData()
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Run History',
      href: '/history',
      icon: History,
    },
    {
      name: 'Algorithms',
      href: '/algorithms',
      icon: Dices,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ]

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary"></div>
          <span className="text-xl font-bold">Teraverse</span>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className={cn('mr-3 h-5 w-5', isActive ? 'text-primary' : '')} />
              <span>{item.name}</span>
              {isActive && <ChevronRight className="ml-auto h-4 w-4 text-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{username || 'User'}</p>
            <p className="text-xs text-muted-foreground">Gigaverse Player</p>
          </div>
          <ThemeSwitcher />
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/20"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Bouton de menu mobile */}
      {isMobile && (
        <div className="fixed left-4 top-4 z-50">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-background shadow-md"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Sidebar pour desktop */}
      {!isMobile && (
        <div className="hidden h-screen w-64 flex-col border-r bg-background md:flex">
          {sidebarContent}
        </div>
      )}

      {/* Sidebar mobile (overlay) */}
      {isMobile && isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 h-full w-64 flex-col border-r bg-background">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}
