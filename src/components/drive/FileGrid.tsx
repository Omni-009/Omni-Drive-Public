import { Check, FileText, MoreVertical, Play } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { Card } from '@/components/ui/card'
import { FileIcon } from '@/components/drive/FileIcon'
import type { FileItem } from '@/data/drive-data'
import { API_URL } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import { cn } from '@/lib/utils'

export type FileSizeScale = 'xs' | 'sm' | 'md' | 'lg'

function getFileExtension(name: string): string {
  const parts = name.split('.')
  if (parts.length > 1) {
    return parts.pop()?.toUpperCase() || ''
  }
  return ''
}

function FileThumbnailPreview({ file, token }: { file: FileItem; token: string }) {
  const [imgError, setImgError] = useState(false)
  const ext = getFileExtension(file.name)

  // Real Image Thumbnail
  if (file.kind === 'image' && file.id && !imgError) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-slate-900/10 dark:bg-black/30 flex items-center justify-center">
        <img
          src={`${API_URL}/files/raw/${file.id}?auth=${token}`}
          alt={file.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // Video Thumbnail / Poster
  if (file.kind === 'video') {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white shadow-lg transition-transform duration-200 group-hover:scale-110">
          <Play className="h-4 w-4 fill-white translate-x-0.5" />
        </div>
        <span className="absolute bottom-2 right-2 rounded-md bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
          {ext || 'VIDEO'}
        </span>
      </div>
    )
  }

  // Documents & PDFs (Rendered as clean paper document sheets)
  if (file.kind === 'pdf' || file.kind === 'doc') {
    const isPdf = file.kind === 'pdf' || ext === 'PDF'
    const isSheet = ext === 'XLS' || ext === 'XLSX' || ext === 'CSV'
    const isSlide = ext === 'PPT' || ext === 'PPTX'

    const badgeColor = isPdf
      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
      : isSheet
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : isSlide
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'

    return (
      <div className="relative flex h-full w-full flex-col justify-between p-3 bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-800/80 dark:to-slate-900/90">
        <div className="flex items-center justify-between">
          <span className={cn("rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider", badgeColor)}>
            {ext || (isPdf ? 'PDF' : 'DOC')}
          </span>
          <FileText className="h-4 w-4 text-slate-400/70" />
        </div>
        <div className="space-y-1.5 py-1 opacity-40">
          <div className="h-1.5 w-3/4 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-1.5 w-4/5 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-1.5 w-1/2 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="truncate max-w-[80px] font-mono">{file.size}</span>
        </div>
      </div>
    )
  }

  // Fallback icon
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 dark:bg-slate-800/40">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
        <FileIcon kind={file.kind} className="h-6 w-6" />
      </div>
    </div>
  )
}

export function FileGrid({
  files,
  selectedFileIds = new Set<string>(),
  onFileContextMenu,
  onToggleFile,
  onFileOpen
}: {
  files: FileItem[]
  selectedFileIds?: Set<string>
  sizeScale?: FileSizeScale
  onFileContextMenu?: (event: MouseEvent<HTMLElement>, file: FileItem) => void
  onToggleFile?: (file: FileItem) => void
  onFileOpen?: (file: FileItem) => void
}) {
  const token = getAccessToken() || ''

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
      {files.map((file) => {
        const selected = selectedFileIds.has(file.id ?? '')
        const ext = getFileExtension(file.name)

        return (
          <Card
            key={file.id ?? file.name}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', file.id ?? '')
              event.dataTransfer.effectAllowed = 'move'
            }}
            onClick={() => onFileOpen?.(file)}
            onContextMenu={(event) => onFileContextMenu?.(event, file)}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer select-none",
              selected
                ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/30"
                : "border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            )}
          >
            {/* Portrait Preview Container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800/60">
              <FileThumbnailPreview file={file} token={token} />

              {/* Floating Top Controls */}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-1.5 z-10 pointer-events-none">
                {/* Selection Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleFile?.(file)
                  }}
                  className={cn(
                    "pointer-events-auto flex h-6 w-6 items-center justify-center rounded-lg border transition-all",
                    selected
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm opacity-100"
                      : "bg-black/30 backdrop-blur-md border-white/40 text-transparent opacity-70 sm:opacity-0 group-hover:opacity-100 hover:opacity-100 active:opacity-100"
                  )}
                  aria-label={`Select ${file.name}`}
                >
                  <Check className={cn("h-3.5 w-3.5 stroke-[3]", selected ? "text-white" : "text-white/60")} />
                </button>

                {/* 3-Dots Menu Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFileContextMenu?.(e, file)
                  }}
                  className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg bg-black/35 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
                  aria-label={`Open ${file.name} menu`}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Structured Card Footer */}
            <div className="flex flex-1 flex-col justify-between p-2.5 gap-1.5">
              <p
                className="truncate text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                title={file.name}
              >
                {file.name}
              </p>

              <div className="flex items-center justify-between gap-1 text-[10px]">
                <span className="font-mono font-medium text-slate-500 dark:text-slate-400">
                  {file.size}
                </span>

                <span className="rounded bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 font-bold uppercase text-[9px] text-slate-600 dark:text-slate-300">
                  {ext || file.kind}
                </span>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
