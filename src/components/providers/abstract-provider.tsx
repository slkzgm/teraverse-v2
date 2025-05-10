// path: src/components/providers/abstract-provider.tsx
'use client'

import { AbstractWalletProvider } from '@abstract-foundation/agw-react'
import { abstract } from 'viem/chains'
import React from 'react'

export default function AbstractProvider({ children }: { children: React.ReactNode }) {
  return <AbstractWalletProvider chain={abstract}>{children}</AbstractWalletProvider>
}
