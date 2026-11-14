import { useState, useEffect } from 'react'
import { FolderSync, Plus, Trash2, Smartphone, Folder, Wifi, Zap, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

interface BackupRule {
  id: string
  localFolderName: string
  targetFolderId: string
  targetFolderName?: string
  wifiOnly: boolean
  chargingOnly: boolean
  fileType: string
  status: string
  lastSyncedAt?: string | null
}

interface VirtualFolder {
  id: string
  name: string
}

const PRESET_LOCAL_FOLDERS = [
  { name: 'Camera (DCIM)', desc: 'Camera photos and recorded videos' },
  { name: 'WhatsApp Images', desc: 'Photos received on WhatsApp' },
  { name: 'Screenshots', desc: 'Captured phone screenshots' },
  { name: 'Downloads', desc: 'Files downloaded from browser' },
  { name: 'Documents', desc: 'PDFs and office documents' },
]

export function AutoBackupSettings() {
  const [rules, setRules] = useState<BackupRule[]>([])
  const [folders, setFolders] = useState<VirtualFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Form state
  const [selectedLocal, setSelectedLocal] = useState('Camera (DCIM)')
  const [customLocal, setCustomLocal] = useState('')
  const [selectedTarget, setSelectedTarget] = useState('')
  const [wifiOnly, setWifiOnly] = useState(true)
  const [chargingOnly, setChargingOnly] = useState(false)
  const [fileType, setFileType] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [rulesRes, foldersRes] = await Promise.all([
        apiFetch<BackupRule[]>('/backup/rules').catch(() => []),
        apiFetch<VirtualFolder[]>('/folders?all=1').catch(() => [])
      ])
      setRules(rulesRes || [])
      setFolders(foldersRes || [])
      if (foldersRes && foldersRes.length > 0 && !selectedTarget) {
        setSelectedTarget(foldersRes[0].id)
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const localFolder = selectedLocal === 'custom' ? customLocal.trim() : selectedLocal
    if (!localFolder) {
      setMessage('Please enter a folder name.')
      setSaving(false)
      return
    }

    try {
      const targetFolderObj = folders.find(f => f.id === selectedTarget)
      await apiFetch('/backup/rules', {
        method: 'POST',
        body: JSON.stringify({
          localFolderName: localFolder,
          targetFolderId: selectedTarget,
          targetFolderName: targetFolderObj ? targetFolderObj.name : 'Selected Folder',
          wifiOnly,
          chargingOnly,
          fileType
        })
      })
      setMessage('Backup rule created successfully!')
      setModalOpen(false)
      loadData()
    } catch (err: any) {
      setMessage(err?.message || 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteRule(id: string) {
    try {
      await apiFetch(`/backup/rules/${id}`, { method: 'DELETE' })
      setRules(rules.filter(r => r.id !== id))
    } catch {
      // Ignored
    }
  }

  return (
    <Card className="overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <FolderSync className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100">Smart Folder Auto Backup</h2>
              <p className="text-[12px] text-slate-500">
                Sync specific phone folders directly into dedicated cloud folders.
              </p>
            </div>
          </div>
        </div>

        <Button size="sm" onClick={() => setModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Add Folder Rule</span>
        </Button>
      </div>

      {message && (
        <div className="mt-3.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Rules List */}
      <div className="mt-4 grid gap-3">
        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">Loading backup rules...</p>
        ) : rules.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <Smartphone className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Auto Backup Rules Yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create a rule like &ldquo;Camera ➡️ Images&rdquo; to automatically backup your photos silently without duplicate uploads.
            </p>
          </div>
        ) : (
          rules.map(rule => (
            <div
              key={rule.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center font-bold text-xs">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{rule.localFolderName}</span>
                    <span className="text-xs text-slate-400">➡️</span>
                    <span className="font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Folder className="h-3.5 w-3.5" />
                      {rule.targetFolderName || 'Cloud Folder'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {rule.wifiOnly && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Wifi className="h-3 w-3" /> Wi-Fi Only
                      </span>
                    )}
                    {rule.chargingOnly && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                        <Zap className="h-3 w-3" /> While Charging
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      Type: <strong className="uppercase">{rule.fileType}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal to Add Rule */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderSync className="h-5 w-5 text-blue-600" />
              Configure Folder Backup
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select which mobile folder to sync and choose the destination OmniDrive virtual folder.
            </p>

            <form onSubmit={handleCreateRule} className="mt-4 grid gap-3.5">
              {/* Local Folder Selection */}
              <label className="grid gap-1.5 text-xs font-bold text-slate-500">
                Phone Folder (Source)
                <select
                  className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:border-blue-600 focus:outline-none"
                  value={selectedLocal}
                  onChange={e => setSelectedLocal(e.target.value)}
                >
                  {PRESET_LOCAL_FOLDERS.map(f => (
                    <option key={f.name} value={f.name}>{f.name} ({f.desc})</option>
                  ))}
                  <option value="custom">+ Custom Phone Folder</option>
                </select>
              </label>

              {selectedLocal === 'custom' && (
                <label className="grid gap-1.5 text-xs font-bold text-slate-500">
                  Enter Local Folder Name
                  <input
                    className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:border-blue-600 focus:outline-none"
                    placeholder="e.g. Movies, Invoices"
                    value={customLocal}
                    onChange={e => setCustomLocal(e.target.value)}
                    required
                  />
                </label>
              )}

              {/* Destination Virtual Folder */}
              <label className="grid gap-1.5 text-xs font-bold text-slate-500">
                OmniDrive Destination Folder
                <select
                  className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm focus:border-blue-600 focus:outline-none"
                  value={selectedTarget}
                  onChange={e => setSelectedTarget(e.target.value)}
                >
                  {folders.length === 0 ? (
                    <option value="">Root / All Files</option>
                  ) : (
                    folders.map(f => (
                      <option key={f.id} value={f.id}>📁 {f.name}</option>
                    ))
                  )}
                </select>
              </label>

              {/* File Type Filter */}
              <label className="grid gap-1.5 text-xs font-bold text-slate-500">
                File Type to Sync
                <div className="grid grid-cols-3 gap-2 mt-0.5">
                  {[
                    { id: 'all', label: 'All Files' },
                    { id: 'photos', label: 'Photos Only' },
                    { id: 'videos', label: 'Videos Only' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFileType(t.id)}
                      className={`h-9 rounded-xl border text-xs font-bold transition-all ${
                        fileType === t.id
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </label>

              {/* Smart Toggles */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-950/50 grid gap-2.5">
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-emerald-600" />
                    Sync only on Wi-Fi (Save mobile data)
                  </span>
                  <input
                    type="checkbox"
                    checked={wifiOnly}
                    onChange={e => setWifiOnly(e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Sync only while Charging (Save battery)
                  </span>
                  <input
                    type="checkbox"
                    checked={chargingOnly}
                    onChange={e => setChargingOnly(e.target.checked)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? 'Saving Rule...' : 'Save & Enable Backup'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  )
}
