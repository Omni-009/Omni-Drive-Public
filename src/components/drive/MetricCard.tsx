import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/60">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}
