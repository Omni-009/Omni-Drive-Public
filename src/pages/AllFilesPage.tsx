import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, Cloud, Download, FolderInput, FolderPlus, LayoutGrid, Link2, List, Pipette, RefreshCw, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DummyModal } from '@/components/drive/DummyModal'
import { EmptyAreaContextMenu } from '@/components/drive/EmptyAreaContextMenu'
import { FileContextMenu } from '@/components/drive/FileContextMenu'
import { FileDetailsDrawer } from '@/components/drive/FileDetailsDrawer'
import { FileGrid } from '@/components/drive/FileGrid'
import { FileTable } from '@/components/drive/FileTable'
import { FolderContextMenu } from '@/components/drive/FolderContextMenu'
import { FolderGrid, type FolderSizeScale } from '@/components/drive/FolderGrid'
import { defaultFolderColor, defaultFolderIconUrl, folderColorOptions, folderIconOptions, folderIconsMap, normalizeFolderColor, normalizeFolderIconKey } from '@/components/drive/FolderVisual'
import { Input } from '@/components/ui/input'
import { API_URL, apiFetch, formatBytes, formatDate } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import { createPlyr, ensurePlyr } from '@/lib/plyr'
import { getPreviewKind, officeViewerUrl } from '@/lib/preview'
import { cn } from '@/lib/utils'
import type { FileItem, FolderItem } from '@/data/drive-data'
import { useUpload } from '@/context/UploadContext'
import { useDriveLayoutActions } from '@/layouts/DriveLayout'

type BackendFile = { id: string; name: string; mimeType: string; sizeBytes: string; createdAt: string; folderId?: string | null; connectedAccount?: { email: string; provider: string }; folder?: { id: string; name: string } | null }
type BackendFolder = { id: string; name: string; color: string; iconUrl?: string | null; parentId?: string | null; providerFolderId?: string | null; updatedAt: string }
type ConnectedAccount = { id: string; provider: string; email: string; displayName?: string | null; status: string }

const sizeActiveClasses: Record<FolderSizeScale, string> = {
  xs: 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 shadow-xs',
  sm: 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 shadow-xs',
  md: 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 shadow-xs',
  lg: 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 shadow-xs'
}

type FileViewMode = 'list' | 'grid'

const fileViewStorageKey = '9drive:all-files-view-mode'

function getStoredFileViewMode(): FileViewMode {
  const stored = localStorage.getItem(fileViewStorageKey)
  return stored === 'grid' || stored === 'list' ? stored : 'grid'
}

function mimeToKind(mimeType: string): FileItem['kind'] {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf')) return 'pdf'
  return 'doc'
}

function providerLabel(provider: string | undefined) {
  if (provider === 's3') return 'S3 Storage'
  return 'Google Drive'
}

function mapFile(file: BackendFile): FileItem {
  return { id: file.id, name: file.name, mimeType: file.mimeType, sizeBytes: file.sizeBytes, createdAt: file.createdAt, accountEmail: file.connectedAccount?.email, accountProvider: providerLabel(file.connectedAccount?.provider), date: formatDate(file.createdAt), size: formatBytes(file.sizeBytes), access: file.connectedAccount?.email ?? providerLabel(file.connectedAccount?.provider), kind: mimeToKind(file.mimeType), shared: 1, folderId: file.folderId, folderName: file.folder?.name }
}

function mapFolder(folder: BackendFolder): FolderItem {
  return { id: folder.id, name: folder.name, color: folder.color, iconUrl: folder.iconUrl, parentId: folder.parentId, providerFolderId: folder.providerFolderId, updated: `Updated ${formatDate(folder.updatedAt)}` }
}



function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b }
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b }
  }
  return null
}

function FolderAppearanceFields({ color, iconUrl, onColorChange, onIconChange }: { color: string; iconUrl: string; onColorChange: (color: string) => void; onIconChange: (iconUrl: string) => void }) {
  const normalizedColor = normalizeFolderColor(color)
  const selectedIconKey = normalizeFolderIconKey(iconUrl)
  const selectedIconObj = folderIconOptions.find(o => o.key === selectedIconKey)
  const rgb = hexToRgb(normalizedColor)
  const rgbLabel = rgb ? `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})` : 'RGB'

  return (
    <div className="grid gap-4">
      {/* Folder Color Section with RGB / Hex System */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Folder Color</span>
          <span className="rounded-md bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {rgbLabel}
          </span>
        </div>

        {/* Color swatch trigger + Hex input */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-2">
          <label
            className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg shadow-sm border border-black/10 dark:border-white/10 transition-transform active:scale-95"
            style={{ backgroundColor: normalizedColor }}
            title="Click to pick custom color"
          >
            <input
              type="color"
              value={normalizedColor.startsWith('#') && normalizedColor.length === 7 ? normalizedColor : '#3b82f6'}
              onChange={(event) => onColorChange(event.target.value)}
              className="sr-only"
            />
            <Pipette className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] opacity-90 hover:opacity-100" />
          </label>
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">#</span>
            <input
              type="text"
              value={normalizedColor.replace('#', '').toUpperCase()}
              maxLength={6}
              onChange={(event) => {
                const val = event.target.value.replace(/[^0-9A-Fa-f]/g, '')
                if (val.length <= 6) {
                  onColorChange(`#${val}`)
                }
              }}
              placeholder="3B82F6"
              className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-7 pr-3 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Preset color swatches */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {folderColorOptions.map((option) => {
            const isSelected = normalizedColor.toLowerCase() === option.toLowerCase()
            return (
              <button
                key={option}
                type="button"
                onClick={() => onColorChange(option)}
                className={cn(
                  'h-7 w-7 rounded-full shadow-xs transition-all hover:scale-110 active:scale-95',
                  isSelected
                    ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900 scale-105'
                    : 'border border-black/10 dark:border-white/10 hover:opacity-90'
                )}
                style={{ backgroundColor: option }}
                aria-label={`Use ${option} folder color`}
              />
            )
          })}
        </div>
      </div>

      {/* Folder Icon Section inside a Fixed Scrollable Box */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Folder Icon</span>
          {selectedIconObj && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Selected: <strong className="text-slate-700 dark:text-slate-200">{selectedIconObj.label}</strong>
            </span>
          )}
        </div>

        {/* Scrollable Fixed Box */}
        <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-2.5">
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {folderIconOptions.map((option) => {
              const IconComp = folderIconsMap[option.key]
              const isSelected = selectedIconKey === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onIconChange(option.key)}
                  className={cn(
                    'flex h-11 items-center justify-center rounded-xl transition-all active:scale-95',
                    isSelected
                      ? 'border-2 border-blue-600 bg-blue-50/90 dark:bg-blue-950/60 shadow-xs ring-1 ring-blue-500/20'
                      : 'border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  )}
                  title={option.label}
                  aria-label={`Use ${option.label} icon`}
                >
                  {IconComp && <IconComp className="h-5 w-5 transition-transform" style={{ color: normalizedColor }} />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AllFilesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeFolderId = searchParams.get('folderId')
  const searchQuery = searchParams.get('q')?.trim() ?? ''
  const [uploadOpen, setUploadOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [folderRenameOpen, setFolderRenameOpen] = useState(false)
  const [folderDeleteOpen, setFolderDeleteOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copiedShareLink, setCopiedShareLink] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewError, setPreviewError] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [allFolders, setAllFolders] = useState<FolderItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [isUploadDragging, setIsUploadDragging] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderColor, setFolderColor] = useState(defaultFolderColor)
  const [folderIconUrl, setFolderIconUrl] = useState(defaultFolderIconUrl)
  const [renameValue, setRenameValue] = useState('')
  const [folderRenameValue, setFolderRenameValue] = useState('')
  const [folderRenameColor, setFolderRenameColor] = useState(defaultFolderColor)
  const [folderRenameIconUrl, setFolderRenameIconUrl] = useState(defaultFolderIconUrl)
  const [activeFile, setActiveFile] = useState<FileItem | null>(null)
  const [activeFolderForMenu, setActiveFolderForMenu] = useState<FolderItem | null>(null)
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [cutFolder, setCutFolder] = useState<FolderItem | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem | null }>({ x: 0, y: 0, file: null })
  const [folderContextMenu, setFolderContextMenu] = useState<{ x: number; y: number; folder: FolderItem | null }>({ x: 0, y: 0, folder: null })
  const [emptyContextMenu, setEmptyContextMenu] = useState<{ x: number; y: number; open: boolean }>({ x: 0, y: 0, open: false })
  const [message, setMessage] = useState('')
  const [gdrivePublicUrl, setGdrivePublicUrl] = useState('')
  const [makingPublic, setMakingPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncingDrive, setSyncingDrive] = useState(false)
  const [fileViewMode, setFileViewMode] = useState<FileViewMode>(getStoredFileViewMode)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'image' | 'doc' | 'video'>('all')

  const filteredFiles = useMemo(() => {
    if (categoryFilter === 'all') return files
    if (categoryFilter === 'doc') return files.filter(f => f.kind === 'doc' || f.kind === 'pdf')
    return files.filter(f => f.kind === categoryFilter)
  }, [files, categoryFilter])

  const fileCounts = useMemo(() => {
    return {
      all: files.length,
      image: files.filter(f => f.kind === 'image').length,
      doc: files.filter(f => f.kind === 'doc' || f.kind === 'pdf').length,
      video: files.filter(f => f.kind === 'video').length,
    }
  }, [files])
  const { uploadFiles } = useUpload()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteTargetType, setInviteTargetType] = useState<'file' | 'folder'>('file')
  const [inviteTargetId, setInviteTargetId] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [inviting, setInviting] = useState(false)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const [folderSizeScale, setFolderSizeScale] = useState<FolderSizeScale>(() => {
    const v = localStorage.getItem('9drive:folder-size')
    return (v === 'xs' || v === 'sm' || v === 'md' || v === 'lg') ? v : 'md'
  })
  const { setHeaderActions } = useDriveLayoutActions()
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([])
  const [selectedTargetAccountId, setSelectedTargetAccountId] = useState('')

  function changeFolderSize(scale: FolderSizeScale) {
    setFolderSizeScale(scale)
    localStorage.setItem('9drive:folder-size', scale)
  }

  async function loadFiles() {
    const params = new URLSearchParams()
    if (activeFolderId) params.set('folderId', activeFolderId)
    if (searchQuery) params.set('q', searchQuery)

    // Add advanced search filters
    const kind = searchParams.get('kind')
    const accountId = searchParams.get('accountId')
    const minSize = searchParams.get('minSize')
    const maxSize = searchParams.get('maxSize')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (kind) params.set('kind', kind)
    if (accountId) params.set('accountId', accountId)
    if (minSize) params.set('minSize', minSize)
    if (maxSize) params.set('maxSize', maxSize)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    const query = params.toString()
    const path = query ? `/files?${query}` : '/files'
    const data = await apiFetch<{ files: BackendFile[] }>(path)
    setFiles((data?.files || []).map(mapFile))
  }

  async function loadFolders() {
    const visiblePath = activeFolderId ? `/folders?parentId=${activeFolderId}` : '/folders'
    const [visibleData, allData] = await Promise.all([
      apiFetch<{ folders: BackendFolder[] }>(visiblePath),
      apiFetch<{ folders: BackendFolder[] }>('/folders?all=1'),
    ])
    setFolders((visibleData?.folders || []).map(mapFolder))
    setAllFolders((allData?.folders || []).map(mapFolder))
  }

  async function loadAll() {
    await Promise.all([loadFiles(), loadFolders()])
  }

  async function handleDropItem(fileId: string, targetFolderId: string) {
    const fileIds = selectedFileIds.has(fileId) ? Array.from(selectedFileIds) : [fileId]
    setLoading(true)
    setMessage('')
    try {
      await apiFetch('/files/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds, folderId: targetFolderId })
      })
      setMessage(`Successfully moved ${fileIds.length} item(s).`)
      loadAll().catch(() => undefined)
      setSelectedFileIds(new Set())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to move items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to load files'))
    setSelectedFileIds(new Set())
  }, [activeFolderId, searchQuery])

  async function connectDrive() {
    const popup = window.open('', 'google-drive-connect', 'width=540,height=720')
    if (popup) {
      popup.document.write('<html><head><title>Connecting Google Drive...</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;}</style></head><body><div style="text-align:center;"><h2>Connecting to Google...</h2><p>Please wait while we redirect you.</p></div></body></html>')
    }
    try {
      const data = await apiFetch<{ url: string }>('/connected-accounts/google/connect-url')
      if (popup) {
        popup.location.href = data.url
      } else {
        window.location.href = data.url
      }
    } catch (e) {
      if (popup) popup.close()
      console.error('Failed to start Google Drive connection:', e)
      setMessage('Failed to initiate Google OAuth connect.')
    }
  }

  useEffect(() => {
    async function loadConnectedAccounts() {
      try {
        const data = await apiFetch<{ accounts: ConnectedAccount[] }>('/connected-accounts')
        setConnectedAccounts(data.accounts || [])
      } catch (error) {
        console.error('Failed to load connected accounts:', error)
      }
    }
    loadConnectedAccounts()

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== 'GOOGLE_CONNECTED') return
      loadConnectedAccounts().then(() => {
        window.dispatchEvent(new Event('9drive:storage-changed'))
        setMessage('Google Drive connected successfully!')
        setTimeout(() => setMessage(''), 4000)
      })
    }
    window.addEventListener('message', onMessage)

    const handleStorageChanged = () => loadConnectedAccounts()
    window.addEventListener('9drive:storage-changed', handleStorageChanged)

    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('9drive:storage-changed', handleStorageChanged)
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setContextMenu({ x: 0, y: 0, file: null })
      if (event.key === 'Escape') setFolderContextMenu({ x: 0, y: 0, folder: null })
      if (event.key === 'Escape') setEmptyContextMenu({ x: 0, y: 0, open: false })
      if (event.ctrlKey && event.key.toLowerCase() === 'x' && activeFolderForMenu) {
        event.preventDefault()
        cutSelectedFolder(activeFolderForMenu)
      }
      if (event.ctrlKey && event.key.toLowerCase() === 'v' && cutFolder) {
        event.preventDefault()
        pasteFolder().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to paste folder'))
      }
    }

    function onOpenMoveShortcut(e: Event) {
      const file = (e as CustomEvent).detail as FileItem
      setActiveFile(file)
      setSelectedFolderId(file.folderId || '')
      setMoveOpen(true)
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('9drive:open-move-modal', onOpenMoveShortcut)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('9drive:open-move-modal', onOpenMoveShortcut)
    }
  }, [activeFolderForMenu, cutFolder, activeFolderId])

  useEffect(() => {
    if (!previewOpen || !activeFile?.mimeType?.startsWith('video/') || !previewVideoRef.current) return undefined
    let disposed = false
    let player: { destroy: () => void } | null = null

    ensurePlyr().then(() => {
      if (disposed || !previewVideoRef.current) return
      player = createPlyr(previewVideoRef.current)
    }).catch(() => undefined)

    return () => {
      disposed = true
      player?.destroy()
    }
  }, [previewOpen, activeFile?.mimeType, previewUrl])

  async function createFolder(event: FormEvent) {
    event.preventDefault()
    await apiFetch('/folders', { method: 'POST', body: JSON.stringify({ name: folderName, color: folderColor, iconUrl: folderIconUrl, parentId: activeFolderId ?? null }) })
    setFolderName('')
    setFolderColor(defaultFolderColor)
    setFolderIconUrl(defaultFolderIconUrl)
    setFolderOpen(false)
    await loadFolders()
  }

  async function uploadFile(event: FormEvent) {
    event.preventDefault()
    if (selectedFiles.length === 0) return
    setLoading(true)
    setMessage('')

    const uploadingFiles = [...selectedFiles]
    const targetFolderId = activeFolderId || selectedFolderId
    const targetAccountId = selectedTargetAccountId || null

    setSelectedFiles([])
    setSelectedFolderId('')
    setSelectedTargetAccountId('')
    setUploadOpen(false)

    try {
      await uploadFiles(uploadingFiles, targetFolderId, targetAccountId)
    } catch (err) {
      console.error('Upload initiation failed:', err)
    } finally {
      setLoading(false)
    }
  }


  async function syncGoogleDrive() {
    setSyncingDrive(true)
    setMessage('')
    try {
      const response = await apiFetch<{ results: { created: number; updated: number; deleted: number }[] }>('/files/sync-google', { method: 'POST', body: JSON.stringify({}) })

      let created = 0, updated = 0, deleted = 0
      for (const res of response.results) {
        created += res.created
        updated += res.updated
        deleted += res.deleted
      }
      const accounts = response.results.length

      setMessage(`Google Drive synced. ${created} added, ${updated} updated, ${deleted} removed across ${accounts} account${accounts === 1 ? '' : 's'}.`)
      await loadAll()
      window.dispatchEvent(new Event('9drive:storage-changed'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to sync Google Drive')
    } finally {
      setSyncingDrive(false)
    }
  }

  function selectUploadFiles(files: FileList | File[] | null | undefined) {
    if (!files) return
    const nextFiles = Array.from(files)
    if (nextFiles.length === 0) return
    setSelectedFiles(nextFiles)
  }

  function removeUploadFile(index: number) {
    setSelectedFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))
  }

  function handleUploadDrag(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (event.type === 'dragenter' || event.type === 'dragover') setIsUploadDragging(true)
    if (event.type === 'dragleave' || event.type === 'drop') setIsUploadDragging(false)
    if (event.type === 'drop') selectUploadFiles(event.dataTransfer.files)
  }



  function openContext(event: MouseEvent<HTMLElement>, file: FileItem) {
    event.preventDefault()
    event.stopPropagation()
    setActiveFile(file)
    setContextMenu({ x: event.clientX, y: event.clientY, file })
  }

  function toggleFileSelection(file: FileItem) {
    if (!file.id) return
    setSelectedFileIds((current) => {
      const next = new Set(current)
      if (next.has(file.id!)) next.delete(file.id!)
      else next.add(file.id!)
      return next
    })
  }

  function toggleAllVisibleFiles() {
    const visibleIds = files.map((file) => file.id).filter(Boolean) as string[]
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedFileIds.has(id))
    setSelectedFileIds(allSelected ? new Set() : new Set(visibleIds))
  }

  function clearSelection() {
    setSelectedFileIds(new Set())
  }

  function changeFileViewMode(mode: FileViewMode) {
    setFileViewMode(mode)
    localStorage.setItem(fileViewStorageKey, mode)
  }

  function openFolderMenu(event: MouseEvent<HTMLElement>, folder: FolderItem) {
    event.preventDefault()
    event.stopPropagation()
    setActiveFolderForMenu(folder)
    setFolderContextMenu({ x: event.clientX, y: event.clientY, folder })
  }

  function openFolder(folder: FolderItem) {
    if (!folder.id) return
    setSearchParams(searchQuery ? { folderId: folder.id, q: searchQuery } : { folderId: folder.id })
  }

  function openFolderById(folderId: string) {
    setSearchParams(searchQuery ? { folderId, q: searchQuery } : { folderId })
  }

  function openEmptyContextMenu(event: MouseEvent<HTMLElement>) {
    event.preventDefault()
    setEmptyContextMenu({ x: event.clientX, y: event.clientY, open: true })
  }

  function closeFolder() {
    setSearchParams(searchQuery ? { q: searchQuery } : {})
  }

  async function viewFile(fileToView?: FileItem) {
    const file = fileToView ?? activeFile
    if (!file?.id) return
    setActiveFile(file)
    setPreviewUrl('')
    setPreviewError('')
    setPreviewLoading(true)
    setPreviewOpen(true)
    setContextMenu({ x: 0, y: 0, file: null })
    try {
      const data = await apiFetch<{ path?: string; url: string }>(`/files/${file.id}/preview-token`, { method: 'POST' })
      const previewPath = data.path ?? new URL(data.url).pathname
      setPreviewUrl(`${API_URL}${previewPath}`)
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function downloadFile() {
    if (!activeFile?.id) return
    const response = await fetch(`${API_URL}/files/${activeFile.id}/download`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
    if (!response.ok) throw new Error('Download failed')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = activeFile.name
    link.click()
    URL.revokeObjectURL(url)
    setContextMenu({ x: 0, y: 0, file: null })
  }

  async function downloadBatchAsZip() {
    const selectedIds = [...selectedFileIds]
    if (selectedIds.length === 0) return
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`${API_URL}/files/batch-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({ fileIds: selectedIds })
      })
      if (!response.ok) throw new Error('Failed to download ZIP file')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'omnidrive-download.zip'
      link.click()
      URL.revokeObjectURL(url)
      clearSelection()
      setMessage('Batch download complete.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Batch download failed')
    } finally {
      setLoading(false)
    }
  }


  async function renameFile(event: FormEvent) {
    event.preventDefault()
    if (!activeFile?.id) return
    await apiFetch(`/files/${activeFile.id}`, { method: 'PATCH', body: JSON.stringify({ name: renameValue }) })
    setRenameOpen(false)
    await loadFiles()
  }

  async function moveFile(event: FormEvent) {
    event.preventDefault()
    const selectedIds = [...selectedFileIds]
    if (selectedIds.length > 0) await apiFetch('/files/batch', { method: 'PATCH', body: JSON.stringify({ fileIds: selectedIds, folderId: selectedFolderId || null }) })
    else if (activeFile?.id) await apiFetch(`/files/${activeFile.id}`, { method: 'PATCH', body: JSON.stringify({ folderId: selectedFolderId || null }) })
    else return
    setMoveOpen(false)
    setSelectedFolderId('')
    clearSelection()
    await loadFiles()
  }

  async function deleteFile() {
    const selectedIds = [...selectedFileIds]
    if (selectedIds.length > 0) await apiFetch('/files/batch', { method: 'DELETE', body: JSON.stringify({ fileIds: selectedIds }) })
    else if (activeFile?.id) await apiFetch(`/files/${activeFile.id}`, { method: 'DELETE' })
    else return
    setDeleteOpen(false)
    clearSelection()
    await loadFiles()
    window.dispatchEvent(new Event('9drive:storage-changed'))
  }

  async function shareFile() {
    if (!activeFile?.id) return
    const data = await apiFetch<{ url: string }>(`/files/${activeFile.id}/share`, { method: 'POST' })
    setShareUrl(data.url)
    setCopiedShareLink(false)
    setGdrivePublicUrl('')
    setMakingPublic(false)
    setShareOpen(true)
    setContextMenu({ x: 0, y: 0, file: null })
  }

  async function copyShareLinkDirect() {
    if (!activeFile?.id) return
    try {
      const data = await apiFetch<{ url: string | null }>(`/files/${activeFile.id}/view-url`)
      if (data.url) {
        await navigator.clipboard.writeText(data.url)
        setMessage('Google Drive link copied to clipboard!')
        setTimeout(() => setMessage(''), 2500)
      } else {
        const shareData = await apiFetch<{ url: string }>(`/files/${activeFile.id}/share`, { method: 'POST' })
        await navigator.clipboard.writeText(shareData.url)
        setMessage('Share link copied to clipboard!')
        setTimeout(() => setMessage(''), 2500)
      }
    } catch (err: any) {
      setMessage('Failed to copy link: ' + (err.message || err))
      setTimeout(() => setMessage(''), 2500)
    }
    setContextMenu({ x: 0, y: 0, file: null })
  }

  async function inviteToFile() {
    if (!activeFile?.id) return
    setInviteTargetType('file')
    setInviteTargetId(activeFile.id)
    setInviteOpen(true)
    setContextMenu({ x: 0, y: 0, file: null })
  }

  async function inviteToFolder() {
    if (!activeFolderForMenu?.id) return
    setInviteTargetType('folder')
    setInviteTargetId(activeFolderForMenu.id)
    setInviteOpen(true)
    setFolderContextMenu({ x: 0, y: 0, folder: null })
  }

  async function copyFolderLink() {
    if (!activeFolderForMenu?.id) return
    let url = `${window.location.origin}/all-files?folderId=${activeFolderForMenu.id}`
    if (activeFolderForMenu.providerFolderId) {
      url = `https://drive.google.com/open?id=${activeFolderForMenu.providerFolderId}`
    }
    await navigator.clipboard.writeText(url)
    setMessage('Folder link copied to clipboard!')
    setTimeout(() => setMessage(''), 2500)
    setFolderContextMenu({ x: 0, y: 0, folder: null })
  }

  async function sendInvite(event: FormEvent) {
    event.preventDefault()
    if (!inviteTargetId) return
    setInviting(true)
    setInviteMessage('')
    try {
      await apiFetch('/invites', { method: 'POST', body: JSON.stringify({ email: inviteEmail, role: inviteRole, targetType: inviteTargetType, targetId: inviteTargetId }) })
      setInviteEmail('')
      setInviteRole('viewer')
      setInviteMessage('Invite saved. Member will appear in Shared.')
      window.dispatchEvent(new Event('9drive:invites-changed'))
    } catch (error) {
      setInviteMessage(error instanceof Error ? error.message : 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopiedShareLink(true)
    window.setTimeout(() => setCopiedShareLink(false), 1600)
  }

  async function renameFolder(event: FormEvent) {
    event.preventDefault()
    if (!activeFolderForMenu?.id) return
    await apiFetch(`/folders/${activeFolderForMenu.id}`, { method: 'PATCH', body: JSON.stringify({ name: folderRenameValue, color: folderRenameColor, iconUrl: folderRenameIconUrl }) })
    setFolderRenameOpen(false)
    await loadFolders()
  }

  async function deleteFolder() {
    if (!activeFolderForMenu?.id) return
    await apiFetch(`/folders/${activeFolderForMenu.id}`, { method: 'DELETE' })
    setFolderDeleteOpen(false)
    await loadFolders()
  }

  function cutSelectedFolder(folder: FolderItem | null) {
    if (!folder?.id) return
    setCutFolder(folder)
    setFolderContextMenu({ x: 0, y: 0, folder: null })
    setMessage(`Folder "${folder.name}" ready to move. Open target folder and press Ctrl+V.`)
  }

  async function pasteFolder() {
    if (!cutFolder?.id) return
    await apiFetch(`/folders/${cutFolder.id}`, { method: 'PATCH', body: JSON.stringify({ parentId: activeFolderId ?? null }) })
    setMessage(`Folder "${cutFolder.name}" moved.`)
    setCutFolder(null)
    await loadFolders()
  }

  function closePreview() {
    setPreviewUrl('')
    setPreviewError('')
    setPreviewLoading(false)
    setPreviewOpen(false)
  }

  useEffect(() => {
    function handleUploadCompleted() {
      loadAll().catch(() => undefined)
    }
    window.addEventListener('9drive:upload-completed', handleUploadCompleted)
    return () => window.removeEventListener('9drive:upload-completed', handleUploadCompleted)
  }, [activeFolderId])

  useEffect(() => {
    const sizeLabels: FolderSizeScale[] = ['xs', 'sm', 'md', 'lg']
    setHeaderActions(
      <div className="flex items-center gap-2">
        {/* Folder size scale picker */}
        <div className="hidden sm:flex items-center gap-0.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 p-0.5">
          {sizeLabels.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => changeFolderSize(s)}
              className={[
                'rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition-all border border-transparent',
                folderSizeScale === s
                  ? sizeActiveClasses[s]
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
              ].join(' ')}
              aria-label={`Folder size ${s}`}
              aria-pressed={folderSizeScale === s}
            >
              {s}
            </button>
          ))}
        </div>
        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800" />
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="h-3.5 w-3.5" />Upload
        </Button>
        <Button size="sm" variant="outline" onClick={() => setFolderOpen(true)}>
          <FolderPlus className="h-3.5 w-3.5" />New Folder
        </Button>
        <Button size="sm" variant="outline" disabled={syncingDrive} onClick={syncGoogleDrive}>
          <RefreshCw className={syncingDrive ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
          {syncingDrive ? 'Syncing...' : 'Sync'}
        </Button>
      </div>
    )
  }, [syncingDrive, folderSizeScale])


  const recentFolders = folders.slice(0, 4)
  const moreFolders = folders.slice(4)
  const activeFolder = allFolders.find((folder) => folder.id === activeFolderId)
  const folderBreadcrumbs = (() => {
    if (!activeFolder) return []
    const foldersById = new Map(allFolders.map((folder) => [folder.id, folder]))
    const path: FolderItem[] = []
    const visited = new Set<string>()
    let current: FolderItem | undefined = activeFolder
    while (current?.id && !visited.has(current.id)) {
      path.unshift(current)
      visited.add(current.id)
      current = current.parentId ? foldersById.get(current.parentId) : undefined
    }
    return path
  })()
  const allVisibleSelected = files.length > 0 && files.every((file) => file.id && selectedFileIds.has(file.id))
  const activePreviewKind = getPreviewKind(activeFile?.mimeType)

  return (
    <>
      <div onContextMenu={openEmptyContextMenu} className="min-h-[620px] w-full min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div className="min-w-0">
          {activeFolder ? (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 overflow-x-auto py-1">
              <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors" onClick={closeFolder}>
                All Files
              </button>
              {folderBreadcrumbs.map((folder, index) => (
                <span key={folder.id} className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-300 dark:text-slate-600 font-normal">/</span>
                  {index === folderBreadcrumbs.length - 1 ? (
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">{folder.name}</span>
                  ) : (
                    <button className="text-slate-600 dark:text-slate-300 hover:text-blue-600 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => folder.id && openFolderById(folder.id)}>
                      {folder.name}
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">All Files</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your virtual folders and cloud storage</p>
            </div>
          )}
        </div>
      </div>
      {/* Action buttons bar — clean, compact, and organized */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => setUploadOpen(true)} className="h-8.5 rounded-xl px-3 text-xs font-bold">
            <Upload className="h-3.5 w-3.5 mr-1.5" />Upload
          </Button>
          <Button size="sm" variant="outline" onClick={() => setFolderOpen(true)} className="h-8.5 rounded-xl px-3 text-xs font-bold">
            <FolderPlus className="h-3.5 w-3.5 mr-1.5" />New Folder
          </Button>
          <Button size="sm" variant="outline" disabled={syncingDrive} onClick={syncGoogleDrive} className="h-8.5 rounded-xl px-2.5 text-xs font-bold" title="Sync with Google Drive">
            <RefreshCw className={cn("h-3.5 w-3.5", syncingDrive && "animate-spin")} />
            <span className="hidden sm:inline ml-1.5">{syncingDrive ? 'Syncing...' : 'Sync'}</span>
          </Button>
        </div>

        {/* View toggle button: Grid vs List */}
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-xs">
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => changeFileViewMode('grid')}
            className={cn("p-1.5 rounded-lg transition-all", fileViewMode === 'grid' ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="List view"
            onClick={() => changeFileViewMode('list')}
            className={cn("p-1.5 rounded-lg transition-all", fileViewMode === 'list' ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {message ? <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 p-3 text-xs font-semibold text-blue-700 dark:text-blue-300"><span>{message}</span><button onClick={() => setMessage('')} className="p-0.5 hover:opacity-70"><X className="h-3.5 w-3.5" /></button></div> : null}

      {/* Unified clean empty state when no files and no folders exist */}
      {!activeFolder && recentFolders.length === 0 && files.length === 0 ? (
        <Card className="mt-4 p-8 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3">
            <Upload className="h-7 w-7" />
          </div>
          <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{searchQuery ? `No files found for "${searchQuery}"` : 'Your Storage is Ready'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{searchQuery ? 'Try a different search keyword.' : 'Upload files or create virtual folders to start organizing.'}</p>
          {!searchQuery && (
            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" onClick={() => setUploadOpen(true)} className="rounded-xl px-4 font-bold shadow-xs">
                <Upload className="h-3.5 w-3.5 mr-1.5" />Upload Files
              </Button>
              <Button size="sm" variant="outline" onClick={() => setFolderOpen(true)} className="rounded-xl px-4 font-bold border-slate-200 dark:border-slate-800">
                <FolderPlus className="h-3.5 w-3.5 mr-1.5" />New Folder
              </Button>
            </div>
          )}
        </Card>
      ) : null}

      {/* Folders Section */}
      {!activeFolder && recentFolders.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Folders</span>
            <span className="text-xs font-semibold text-slate-400">{recentFolders.length}</span>
          </div>
          <FolderGrid items={recentFolders} mobileTwoColumns sizeScale="sm" onFolderMenu={openFolderMenu} onFolderOpen={openFolder} onDropItem={handleDropItem} />
        </div>
      )}

      {!activeFolder && moreFolders.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">All Folders</h2>
          <FolderGrid items={moreFolders} sizeScale="sm" onFolderMenu={openFolderMenu} onFolderOpen={openFolder} onDropItem={handleDropItem} />
        </div>
      )}

      {activeFolder && folders.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Subfolders</h2>
          <FolderGrid items={folders} sizeScale="sm" onFolderMenu={openFolderMenu} onFolderOpen={openFolder} onDropItem={handleDropItem} />
        </div>
      )}

      {/* Files Section Header */}
      {files.length > 0 && (
        <div className="mt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Files</span>
              <span className="text-xs font-semibold text-slate-400">({filteredFiles.length})</span>
              {selectedFileIds.size > 0 ? (
                <div className="flex items-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <span>{selectedFileIds.size} selected</span>
                  <Button size="sm" variant="outline" className="h-5 px-1.5 text-[10px] rounded-lg" onClick={downloadBatchAsZip}><Download className="h-3 w-3 mr-1" />ZIP</Button>
                  <Button size="sm" variant="outline" className="h-5 px-1.5 text-[10px] rounded-lg" onClick={() => setMoveOpen(true)}><FolderInput className="h-3 w-3 mr-1" />Move</Button>
                  <Button size="sm" variant="danger" className="h-5 px-1.5 text-[10px] rounded-lg" onClick={() => setDeleteOpen(true)}><Trash2 className="h-3 w-3 mr-1" />Del</Button>
                  <button onClick={clearSelection} className="text-slate-400 hover:text-slate-600 p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ) : null}
            </div>

            {/* Category Filter Chips for Organized Navigation */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {(['all', 'image', 'doc', 'video'] as const).map((cat) => {
                const labels: Record<string, string> = { all: 'All', image: 'Images', doc: 'Docs', video: 'Videos' }
                const count = fileCounts[cat]
                if (cat !== 'all' && count === 0) return null
                const isActive = categoryFilter === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shrink-0 border",
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    )}
                  >
                    <span>{labels[cat]}</span>
                    <span className={cn("rounded px-1 py-0.2 text-[10px] font-mono", isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-3">
            {fileViewMode === 'grid' ? (
              <FileGrid files={filteredFiles} selectedFileIds={selectedFileIds} sizeScale="sm" onToggleFile={toggleFileSelection} onFileContextMenu={openContext} onFileOpen={(file) => viewFile(file)} />
            ) : (
              <Card className="p-2 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <FileTable files={filteredFiles} selectedFileIds={selectedFileIds} allSelected={allVisibleSelected} onToggleFile={toggleFileSelection} onToggleAll={toggleAllVisibleFiles} onFileContextMenu={openContext} onFileOpen={(file) => viewFile(file)} />
              </Card>
            )}
          </div>
        </div>
      )}

      {files.length === 0 && (recentFolders.length > 0 || activeFolder) && (
        <Card className="mt-4 p-6 flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <Upload className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-1.5" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{searchQuery ? `No files found for "${searchQuery}"` : 'No files in this folder'}</p>
          <Button size="sm" onClick={() => setUploadOpen(true)} className="mt-3 rounded-xl px-3 text-xs font-bold shadow-xs">
            <Upload className="h-3.5 w-3.5 mr-1" />Upload File
          </Button>
        </Card>
      )}
      </div>
      <EmptyAreaContextMenu x={emptyContextMenu.x} y={emptyContextMenu.y} open={emptyContextMenu.open} canPasteFolder={Boolean(cutFolder)} onClose={() => setEmptyContextMenu({ x: 0, y: 0, open: false })} onUpload={() => { setUploadOpen(true); setEmptyContextMenu({ x: 0, y: 0, open: false }) }} onCreateFolder={() => { setFolderOpen(true); setEmptyContextMenu({ x: 0, y: 0, open: false }) }} onPasteFolder={() => { pasteFolder().catch((error) => setMessage(error instanceof Error ? error.message : 'Failed to paste folder')); setEmptyContextMenu({ x: 0, y: 0, open: false }) }} />
      <FileContextMenu x={contextMenu.x} y={contextMenu.y} file={contextMenu.file} onClose={() => setContextMenu({ x: 0, y: 0, file: null })} onView={viewFile} onDownload={downloadFile} onRename={() => { setRenameValue(activeFile?.name ?? ''); setRenameOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} onMove={() => { setMoveOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} onDetails={() => { setDetailOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} onShare={shareFile} onCopyLink={copyShareLinkDirect} onInvite={inviteToFile} onDelete={() => { setDeleteOpen(true); setContextMenu({ x: 0, y: 0, file: null }) }} />
      <FolderContextMenu x={folderContextMenu.x} y={folderContextMenu.y} folder={folderContextMenu.folder} onClose={() => setFolderContextMenu({ x: 0, y: 0, folder: null })} onCut={() => cutSelectedFolder(activeFolderForMenu)} onRename={() => { setFolderRenameValue(activeFolderForMenu?.name ?? ''); setFolderRenameColor(normalizeFolderColor(activeFolderForMenu?.color)); setFolderRenameIconUrl(activeFolderForMenu?.iconUrl ?? defaultFolderIconUrl); setFolderRenameOpen(true); setFolderContextMenu({ x: 0, y: 0, folder: null }) }} onInvite={inviteToFolder} onCopyLink={copyFolderLink} onDelete={() => { setFolderDeleteOpen(true); setFolderContextMenu({ x: 0, y: 0, folder: null }) }} />
      <FileDetailsDrawer open={detailOpen} file={activeFile} onClose={() => setDetailOpen(false)} />

      <DummyModal open={uploadOpen} title="Upload File" description="Stream file directly to selected Google Drive account." onClose={() => setUploadOpen(false)}>
        {connectedAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-3 border border-blue-500/20">
              <Cloud className="h-7 w-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Connect Google Drive</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mb-5">
              Connect your Google Drive account in 1-click so OmniDrive can stream and organize your files with zero server storage limits.
            </p>
            <Button
              type="button"
              onClick={connectDrive}
              className="rounded-xl px-5 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Connect Google Drive Now
            </Button>
          </div>
        ) : (
          <form onSubmit={uploadFile} className="grid gap-4">
           <label onDragEnter={handleUploadDrag} onDragOver={handleUploadDrag} onDragLeave={handleUploadDrag} onDrop={handleUploadDrag} className={isUploadDragging ? 'grid cursor-pointer gap-3 rounded-2xl border-2 border-dashed border-blue-500 bg-blue-500/10 p-4 text-center transition sm:p-6' : 'grid cursor-pointer gap-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-center transition hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/30 sm:p-6'}>
            <Upload className={isUploadDragging ? 'mx-auto h-8 w-8 text-blue-600 dark:text-blue-400' : 'mx-auto h-8 w-8 text-slate-400'} />
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Drop file here or click to browse</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Metadata is sent before the file so upload can stream directly to Google Drive.</span>
            <Input type="file" className="sr-only" multiple onChange={(event) => selectUploadFiles(event.target.files)} required={selectedFiles.length === 0} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            Target Storage Account
            <select
              className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              value={selectedTargetAccountId}
              onChange={(event) => setSelectedTargetAccountId(event.target.value)}
            >
              <option value="">Automatic (Default)</option>
              {connectedAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email || account.displayName || account.id} ({account.provider === 's3' ? 'S3' : 'Google Drive'})
                </option>
              ))}
            </select>
          </label>
          {activeFolder ? <p className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-sm text-slate-700 dark:text-slate-300">Uploading to: <b>{activeFolder.name}</b></p> : <label className="grid gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Virtual Folder<select className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500" value={selectedFolderId} onChange={(event) => setSelectedFolderId(event.target.value)}><option value="">No folder</option>{allFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
          {selectedFiles.length > 0 ? <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-600 dark:text-slate-400"><div className="flex items-center justify-between gap-3"><span className="font-bold text-slate-900 dark:text-slate-100">{selectedFiles.length} selected</span><span className="shrink-0">{formatBytes(selectedFiles.reduce((total, file) => total + file.size, 0))}</span></div>{selectedFiles.map((file, index) => <div key={`${file.name}-${file.size}-${index}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-3 py-2"><span className="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-200" title={file.name}>{file.name}</span><span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</span><button type="button" className="shrink-0 text-slate-400 hover:text-red-500" onClick={() => removeUploadFile(index)} aria-label={`Remove ${file.name}`}><X className="h-4 w-4" /></button></div>)}</div> : null}
          <div className="grid gap-3 sm:flex sm:justify-end"><Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button><Button disabled={loading || selectedFiles.length === 0}>{loading ? 'Uploading...' : `Upload${selectedFiles.length > 1 ? ` ${selectedFiles.length} files` : ''}`}</Button></div>
        </form>
        )}
      </DummyModal>
       <DummyModal open={folderOpen} title="New Folder" description="Create a virtual folder for organizing files." onClose={() => setFolderOpen(false)}>
        <form onSubmit={createFolder} className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">Folder Name<Input value={folderName} onChange={(event) => setFolderName(event.target.value)} placeholder="Project Assets" required /></label>
          <FolderAppearanceFields color={folderColor} iconUrl={folderIconUrl} onColorChange={setFolderColor} onIconChange={setFolderIconUrl} />
          <div className="grid gap-3 pt-2 sm:flex sm:justify-end"><Button type="button" variant="outline" onClick={() => setFolderOpen(false)}>Cancel</Button><Button>Create Folder</Button></div>
        </form>
      </DummyModal>
      <DummyModal open={renameOpen} title="Rename File" description={activeFile?.name ?? ''} onClose={() => setRenameOpen(false)}><form onSubmit={renameFile} className="grid gap-4"><Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} required /><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button><Button>Rename</Button></div></form></DummyModal>
      <DummyModal open={moveOpen} title="Move to Folder" description={selectedFileIds.size > 0 ? `Move ${selectedFileIds.size} files` : activeFile?.name ?? ''} onClose={() => setMoveOpen(false)}><form onSubmit={moveFile} className="grid gap-4"><select className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 text-sm focus:outline-none focus:border-blue-500" value={selectedFolderId} onChange={(event) => setSelectedFolderId(event.target.value)}><option value="">No folder</option>{allFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setMoveOpen(false)}>Cancel</Button><Button>Move</Button></div></form></DummyModal>
      <DummyModal open={deleteOpen} title={selectedFileIds.size > 0 ? 'Delete Files' : 'Delete File'} description={selectedFileIds.size > 0 ? `Delete ${selectedFileIds.size} files from Google Drive?` : `Delete ${activeFile?.name ?? 'file'} from Google Drive?`} onClose={() => setDeleteOpen(false)}><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="danger" onClick={deleteFile}>Delete</Button></div></DummyModal>
      <DummyModal open={shareOpen} title="Share Link" description={activeFile?.name ?? ''} onClose={() => setShareOpen(false)}>
        <div className="grid gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">OmniDrive Public Share Link (No GDrive login required)</label>
            <Input value={shareUrl} readOnly />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShareOpen(false)}>Close</Button>
            <Button onClick={copyShareLink}>{copiedShareLink ? <CheckCircle className="h-4 w-4" /> : null}{copiedShareLink ? 'Copied!' : 'Copy Link'}</Button>
          </div>
          {copiedShareLink ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Share link copied to clipboard.</p> : null}

          {activeFile?.accountProvider === 'google_drive' && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Google Drive Direct Link (Public Access)</label>
                <p className="text-xs text-slate-500 mb-2">Configure this file to be publicly accessible on Google Drive so external tools can edit/download it.</p>
              </div>
              {gdrivePublicUrl ? (
                <div className="grid gap-2">
                  <Input value={gdrivePublicUrl} readOnly />
                  <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Google Drive public link generated and copied to clipboard!</p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  disabled={makingPublic}
                  onClick={async () => {
                    if (!activeFile?.id) return
                    setMakingPublic(true)
                    try {
                      const res = await apiFetch<{ url: string }>('/files/' + activeFile.id + '/public-permission', { method: 'POST' })
                      setGdrivePublicUrl(res.url)
                      await navigator.clipboard.writeText(res.url)
                    } catch (err: any) {
                      alert('Failed to update Google Drive permission: ' + (err.message || err))
                    } finally {
                      setMakingPublic(false)
                    }
                  }}
                  className="w-full text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900/50"
                >
                  {makingPublic ? 'Making Public...' : 'Make Public & Copy GDrive Link'}
                </Button>
              )}
            </div>
          )}
        </div>
      </DummyModal>
      <DummyModal open={folderRenameOpen} title="Rename Folder" description={activeFolderForMenu?.name ?? ''} onClose={() => setFolderRenameOpen(false)}><form onSubmit={renameFolder} className="grid gap-4"><Input value={folderRenameValue} onChange={(event) => setFolderRenameValue(event.target.value)} required /><FolderAppearanceFields color={folderRenameColor} iconUrl={folderRenameIconUrl} onColorChange={setFolderRenameColor} onIconChange={setFolderRenameIconUrl} /><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setFolderRenameOpen(false)}>Cancel</Button><Button>Rename</Button></div></form></DummyModal>
      <DummyModal open={folderDeleteOpen} title="Delete Folder" description={`Delete virtual folder ${activeFolderForMenu?.name ?? ''}? Files inside will remain uploaded.`} onClose={() => setFolderDeleteOpen(false)}><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setFolderDeleteOpen(false)}>Cancel</Button><Button variant="danger" onClick={deleteFolder}>Delete</Button></div></DummyModal>
      <DummyModal open={inviteOpen} title="Invite Member" description={`Share ${inviteTargetType === 'file' ? (activeFile?.name ?? 'file') : (activeFolderForMenu?.name ?? 'folder')} with a team member.`} onClose={() => setInviteOpen(false)}>
        <form onSubmit={sendInvite} className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">Email Address<Input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="member@example.com" required /></label>
          <label className="grid gap-2 text-sm font-semibold">Role<select className="h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 text-sm focus:outline-none focus:border-blue-500" value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}><option value="viewer">Can view</option><option value="editor">Can edit</option></select></label>
          {inviteMessage ? <p className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 text-sm font-semibold text-blue-700 dark:text-blue-300">{inviteMessage}</p> : null}
          <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button><Button disabled={inviting}>{inviting ? 'Sending...' : 'Send Invite'}</Button></div>
        </form>
      </DummyModal>
      <DummyModal open={previewOpen} title="File Preview" description={activeFile?.name ?? ''} onClose={closePreview} className="overflow-hidden sm:max-w-[95vw] xl:max-w-[1400px]">
        <div className="flex h-[72dvh] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sm:h-[80vh]">
          {previewLoading ? <div className="p-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Loading preview...</div> : null}
          {previewError ? <div className="p-6 text-center text-sm text-red-600 dark:text-red-400">{previewError}</div> : null}
          {!previewLoading && !previewError && activePreviewKind === 'image' && previewUrl ? <img src={previewUrl} alt={activeFile?.name ?? 'File preview'} className="max-h-full max-w-full object-contain" onError={() => setPreviewError('Failed to load preview.')} /> : null}
          {!previewLoading && !previewError && activePreviewKind === 'video' && previewUrl ? <div className="shared-video-shell"><video ref={previewVideoRef} controls playsInline preload="metadata" onError={() => setPreviewError('Failed to load preview.')}><source src={previewUrl} type={activeFile?.mimeType} /></video></div> : null}
          {!previewLoading && !previewError && activePreviewKind === 'document' && previewUrl ? <iframe src={previewUrl} title={activeFile?.name ?? 'File preview'} className="h-full w-full border-0 bg-white" /> : null}
          {!previewLoading && !previewError && activePreviewKind === 'office' && previewUrl ? <iframe src={officeViewerUrl(previewUrl)} title={activeFile?.name ?? 'File preview'} className="h-full w-full border-0 bg-white" /> : null}
          {!previewLoading && !previewError && !activePreviewKind ? <div className="p-6 text-center text-sm text-slate-500">Preview not available for this file type. Use Download instead.</div> : null}
        </div>
      </DummyModal>
    </>
  )
}
