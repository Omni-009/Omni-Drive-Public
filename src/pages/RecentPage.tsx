import { Clock, Download, Edit3, Eye } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FileTable } from '@/components/drive/FileTable'
import { MetricCard } from '@/components/drive/MetricCard'
import { PageHeader } from '@/components/drive/PageHeader'
import { files } from '@/data/drive-data'

const activities = [
  { text: 'Opened Travel Landing Page', time: '10 minutes ago', icon: Eye },
  { text: 'Edited Campaign Assets', time: '1 hour ago', icon: Edit3 },
  { text: 'Downloaded Wedding Video', time: 'Yesterday', icon: Download },
]

export function RecentPage() {
  return (
    <>
      <PageHeader title="Recent" description="Latest opened and modified files." />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <MetricCard label="Opened Today" value="8" icon={Eye} />
        <MetricCard label="Modified" value="4" icon={Edit3} />
        <MetricCard label="Downloads" value="2" icon={Download} />
      </div>
      <Card className="mt-8 p-5">
        <h2 className="font-extrabold text-slate-900 dark:text-slate-100">Activity</h2>
        <div className="mt-4 grid gap-3">
          {activities.map((activity) => (
            <div key={activity.text} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"><activity.icon className="h-4 w-4" /></div>
              <div className="flex-1"><p className="font-semibold text-slate-900 dark:text-slate-100">{activity.text}</p><p className="text-sm text-slate-500 dark:text-slate-400">{activity.time}</p></div>
              <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
          ))}
        </div>
      </Card>
      <FileTable files={files} mode="recent" />
    </>
  )
}
