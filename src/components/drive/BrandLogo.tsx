import { cn } from '@/lib/utils'

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden shadow-md shadow-blue-500/20', className)}>
      <img src="/logo.png" alt="OmniDrive logo" className="h-full w-full object-cover" />
    </div>
  )
}

