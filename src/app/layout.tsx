// path: src/app/layout.tsx
import type React from 'react'
import type { Metadata } from 'next'
import { Space_Grotesk, Audiowide } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import { NotificationBanner } from '@/components/ui/notification-banner'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
})

const audiowide = Audiowide({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-audiowide',
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'Teraverse - Enhanced Gameplay for Gigaverse',
  description: 'Connect and automate your Gigaverse gameplay experience',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${audiowide.variable}`}
    >
      <body className={`font-sans ${spaceGrotesk.className}`}>
        <Providers>
          <NotificationBanner />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
