// path: src/components/providers/theme-provider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={props.forcedTheme}
      themes={['light', 'dark', 'dim']}
    >
      {children}
    </NextThemesProvider>
  )
}
