import { cn } from '@/lib/utils'
import React, { JSX } from 'react'

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
  as?: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
}

export function Heading({ level = 2, as, children, className, ...props }: HeadingProps) {
  const Tag = `h${as || level}` as keyof JSX.IntrinsicElements

  const styles = {
    1: 'text-4xl font-bold tracking-tight md:text-5xl',
    2: 'text-3xl font-semibold tracking-tight',
    3: 'text-2xl font-semibold',
    4: 'text-xl font-medium',
    5: 'text-lg font-medium',
    6: 'text-base font-medium',
  }

  return React.createElement(
    Tag,
    {
      className: cn(styles[level as keyof typeof styles], 'font-heading', className),
      ...props,
    },
    children
  )
}
