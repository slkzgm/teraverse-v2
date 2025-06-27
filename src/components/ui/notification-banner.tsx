'use client'

import React, { useState, useEffect } from 'react'
import { X, Info, ExternalLink, Github } from 'lucide-react'
import { Button } from './button'

export function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('dev-status-banner-dismissed')
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('dev-status-banner-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="border-b border-border bg-muted/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Info className="h-4 w-4 text-primary" />
          </div>
          
          <div className="flex-1 space-y-2 text-sm">
            <div className="font-medium text-foreground">
              Development Update
            </div>
            
            <div className="text-muted-foreground leading-relaxed">
              Development of Teraverse is temporarily slowed due to other priorities. 
              Don&apos;t worry: since the service was designed to be completely autonomous and free, 
              <span className="font-medium text-foreground"> current functionalities are not at risk of being sunset</span>. 
              New features will unfortunately have to wait until I have more availability.
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Github className="h-4 w-4" />
              <span className="text-xs">Open-source code available on GitHub if you want to contribute</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-muted-foreground text-xs">
                In the meantime, I highly recommend 
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                asChild
              >
                <a 
                  href="https://fireball.gg/join?ref=slkz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <span className="font-medium">Fireball</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <span className="text-muted-foreground text-xs">
                as a high-quality alternative! 
                <span className="opacity-70"> (referral link)</span>
              </span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close notification</span>
          </Button>
        </div>
      </div>
    </div>
  )
} 