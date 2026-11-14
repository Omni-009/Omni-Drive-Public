import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs',
        className,
      )}
      {...props}
    />
  )
}
