import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Cloud,
  Database,
  Filter,
  Gauge,
  HardDrive,
  Link2,
  RefreshCw,
  Search,
  Trash2,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/drive/PageHeader'
import { apiFetch, formatBytes, formatDate } from '@/lib/api'
import { cn } from '@/lib/utils'

type StorageSummary = { totalBytes: string; usedBytes: string; availableBytes: string }
type StorageAccountDetails = {
  totalBytes: string | null
  usedBytes: string
  availableBytes: string | null
  trashBytes?: string | null
  lastSyncedAt: string | null
}
type ConnectedAccount = {
  id: string
  email: string
  displayName?: string | null
  avatarUrl?: string | null
  provider: string
  status: string
  storageAccount?: StorageAccountDetails | null
}
type RoutingMode = 'most_available' | 'round_robin' | 'priority'
type RoutingPolicy = { mode: RoutingMode; priorityAccountIds: string[]; roundRobinCursor: number }

function providerLabel(provider: string) {
  if (provider === 's3') return 'S3 Storage'
  return 'Google Drive'
}

function ProviderIcon({ provider, className = "h-5 w-5" }: { provider: string; className?: string }) {
  if (provider === 's3') {
    return <Database className={className} />
  }
  return <Cloud className={className} />
}

function getUsedBytes(account: ConnectedAccount): number {
  return Number(account.storageAccount?.usedBytes ?? 0)
}

function getTotalBytes(account: ConnectedAccount): number {
  return Number(account.storageAccount?.totalBytes ?? 0)
}

function getAvailableBytes(account: ConnectedAccount): number {
  const total = getTotalBytes(account)
  const used = getUsedBytes(account)
  if (account.storageAccount?.availableBytes !== undefined && account.storageAccount?.availableBytes !== null) {
    return Number(account.storageAccount.availableBytes)
  }
  return Math.max(0, total - used)
}

function pct(account: ConnectedAccount): number {
  const total = getTotalBytes(account)
  const used = getUsedBytes(account)
  return total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
}

function getStatusBadge(percent: number) {
  if (percent >= 90) {
    return {
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      bar: 'bg-rose-500',
      label: 'Critical'
    }
  }
  if (percent >= 75) {
    return {
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      bar: 'bg-amber-500',
      label: 'High'
    }
  }
  return {
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    bar: 'bg-emerald-500',
    label: 'Healthy'
  }
}

export function QuotaTrackerPage() {
  const [summary, setSummary] = useState<StorageSummary | null>(null)
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [routingPolicy, setRoutingPolicy] = useState<RoutingPolicy>({ mode: 'most_available', priorityAccountIds: [], roundRobinCursor: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  // Interactive filters
  const [providerFilter, setProviderFilter] = useState<'all' | 'google_drive' | 's3'>('all')
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'available' | 'used' | 'email'>('available')
  const [searchQuery, setSearchQuery] = useState('')

  async function loadData() {
    let hasError = false
    try {
      // 1. Fetch connected accounts
      const accountsRes = await apiFetch<{ accounts: ConnectedAccount[] }>('/connected-accounts').catch(() => ({ accounts: [] }))
      const fetchedAccounts = accountsRes?.accounts || []
      setAccounts(fetchedAccounts)

      // 2. Fetch storage summary
      const summaryRes = await apiFetch<StorageSummary>('/storage/summary').catch(() => null)
      if (summaryRes) {
        setSummary(summaryRes)
      } else if (fetchedAccounts.length > 0) {
        // Compute summary fallback from accounts if summary endpoint failed
        const total = fetchedAccounts.reduce((sum, a) => sum + getTotalBytes(a), 0)
        const used = fetchedAccounts.reduce((sum, a) => sum + getUsedBytes(a), 0)
        setSummary({
          totalBytes: String(total),
          usedBytes: String(used),
          availableBytes: String(Math.max(0, total - used))
        })
      }

      // 3. Fetch routing policy safely
      const policyRes = await apiFetch<{ policy: RoutingPolicy }>('/storage/routing-policy').catch(() => null)
      if (policyRes?.policy) {
        setRoutingPolicy(policyRes.policy)
      }
    } catch (err) {
      hasError = true
      console.error('Failed to load quota tracker data:', err)
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not refresh storage stats' })
    } finally {
      setLoading(false)
      if (!hasError && message?.type === 'error') setMessage(null)
    }
  }

  async function refresh() {
    setRefreshing(true)
    try {
      await loadData()
      setMessage({ type: 'success', text: 'Storage quota & accounts updated.' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleStorageChanged = () => loadData().catch(() => undefined)
    window.addEventListener('9drive:storage-changed', handleStorageChanged)
    return () => window.removeEventListener('9drive:storage-changed', handleStorageChanged)
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => loadData().catch(() => undefined), 30_000)
    return () => window.clearInterval(timer)
  }, [autoRefresh])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== 'GOOGLE_CONNECTED') return
      if (event.data.status === 'success') {
        setMessage({ type: 'success', text: 'Google Drive successfully connected and synchronized!' })
      } else {
        setMessage({ type: 'error', text: 'Google Drive connection failed or was cancelled.' })
      }
      loadData().catch(() => undefined)
      setTimeout(() => setMessage(null), 4000)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

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
      setMessage({ type: 'error', text: 'Failed to initiate Google OAuth connect.' })
    }
  }

  async function syncAccountQuota(accountId: string) {
    setSyncingAccountId(accountId)
    try {
      await apiFetch(`/connected-accounts/${accountId}/sync-quota`, { method: 'POST' })
      await loadData()
      setMessage({ type: 'success', text: 'Account storage quota refreshed from Google Drive!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to sync quota' })
    } finally {
      setSyncingAccountId(null)
    }
  }

  async function disconnectAccount(accountId: string, email: string) {
    if (!confirm(`Are you sure you want to disconnect ${email}? Virtual files routed here will become inaccessible until reconnected.`)) {
      return
    }
    setDeletingAccountId(accountId)
    try {
      await apiFetch(`/connected-accounts/${accountId}`, { method: 'DELETE' })
      await loadData()
      setMessage({ type: 'info', text: `Disconnected ${email}.` })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to disconnect account' })
    } finally {
      setDeletingAccountId(null)
    }
  }

  async function saveRoutingPolicy(nextPolicy: RoutingPolicy) {
    setRoutingPolicy(nextPolicy)
    try {
      const data = await apiFetch<{ policy: RoutingPolicy }>('/storage/routing-policy', {
        method: 'PATCH',
        body: JSON.stringify({ mode: nextPolicy.mode, priorityAccountIds: nextPolicy.priorityAccountIds })
      })
      if (data?.policy) setRoutingPolicy(data.policy)
      setMessage({ type: 'success', text: 'Upload routing strategy updated.' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      console.error('Failed to update routing policy:', err)
    }
  }

  function orderedAccounts(): ConnectedAccount[] {
    const byId = new Map(accounts.map((a) => [a.id, a]))
    const ordered = routingPolicy.priorityAccountIds.map((id) => byId.get(id)).filter((a): a is ConnectedAccount => Boolean(a))
    const orderedIds = new Set(ordered.map((a) => a.id))
    return [...ordered, ...accounts.filter((a) => !orderedIds.has(a.id))]
  }

  function moveAccountPriority(accountId: string, direction: -1 | 1) {
    const ids = orderedAccounts().map((a) => a.id)
    const index = ids.indexOf(accountId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ids.length) return
    const nextIds = [...ids]
    const [item] = nextIds.splice(index, 1)
    nextIds.splice(target, 0, item)
    saveRoutingPolicy({ ...routingPolicy, priorityAccountIds: nextIds })
  }

  // Filter & Sort Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Provider filter
      if (providerFilter === 'google_drive' && acc.provider !== 'google_drive' && acc.provider !== 'google') return false
      if (providerFilter === 's3' && acc.provider !== 's3') return false

      // Account filter
      if (accountFilter !== 'all' && acc.id !== accountFilter) return false

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchEmail = acc.email?.toLowerCase().includes(q)
        const matchName = acc.displayName?.toLowerCase().includes(q)
        if (!matchEmail && !matchName) return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'available') return getAvailableBytes(b) - getAvailableBytes(a)
      if (sortBy === 'used') return getUsedBytes(b) - getUsedBytes(a)
      return (a.email || '').localeCompare(b.email || '')
    })
  }, [accounts, providerFilter, accountFilter, sortBy, searchQuery])

  // Count by provider
  const googleDriveCount = useMemo(() => accounts.filter(a => a.provider === 'google_drive' || a.provider === 'google').length, [accounts])
  const s3Count = useMemo(() => accounts.filter(a => a.provider === 's3').length, [accounts])

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Quota Tracker"
        description="Monitor multi-drive quotas, pool your storage limits, and manage upload routing."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn("h-9 rounded-xl text-xs font-bold", autoRefresh && "border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-950/40")}
            >
              <CheckCircle className={cn("h-3.5 w-3.5 mr-1.5", autoRefresh ? "text-blue-600" : "text-slate-400")} />
              Auto-refresh {autoRefresh ? 'On' : 'Off'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={refreshing}
              className="h-9 rounded-xl text-xs font-bold"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", refreshing && "animate-spin text-blue-600")} />
              {refreshing ? 'Syncing...' : 'Refresh All'}
            </Button>
            <Button
              size="sm"
              onClick={connectDrive}
              className="h-9 rounded-xl px-4 text-xs font-bold shadow-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link2 className="h-3.5 w-3.5 mr-1.5" />
              Connect Drive
            </Button>
          </div>
        }
      />

      {/* Status / Alert Banner */}
      {message && (
        <div
          className={cn(
            "flex items-center justify-between rounded-xl p-3 text-xs sm:text-sm font-semibold border transition-all animate-in fade-in duration-200",
            message.type === 'error' && "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300",
            message.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
            message.type === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300"
          )}
        >
          <div className="flex items-center gap-2">
            {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100 text-xs px-2 py-0.5">Dismiss</button>
        </div>
      )}

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Pooled Storage */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Pooled</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Cloud className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{formatBytes(summary?.totalBytes)}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Combined from {accounts.length} drives</p>
        </Card>

        {/* Used Storage */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Used Space</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{formatBytes(summary?.usedBytes)}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {summary?.totalBytes && Number(summary.totalBytes) > 0
              ? `${Math.round((Number(summary.usedBytes) / Number(summary.totalBytes)) * 100)}% utilized`
              : '0% utilized'}
          </p>
        </Card>

        {/* Available Storage */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Free Space</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Gauge className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{formatBytes(summary?.availableBytes)}</p>
          <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Ready for new uploads</p>
        </Card>

        {/* Connected Drives */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Accounts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{accounts.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{googleDriveCount} Google, {s3Count} S3</p>
        </Card>
      </div>

      {/* Interactive Filter & Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-y border-slate-200/80 dark:border-slate-800 py-3.5">
        {/* Providers & Accounts Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {/* All Providers */}
          <button
            type="button"
            onClick={() => setProviderFilter('all')}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border",
              providerFilter === 'all'
                ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>All Providers</span>
            <span className={cn("rounded-md px-1 py-0.2 text-[10px]", providerFilter === 'all' ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
              {accounts.length}
            </span>
          </button>

          {/* Google Drive */}
          <button
            type="button"
            onClick={() => setProviderFilter('google_drive')}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border",
              providerFilter === 'google_drive'
                ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
            )}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Google Drive</span>
            <span className={cn("rounded-md px-1 py-0.2 text-[10px]", providerFilter === 'google_drive' ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
              {googleDriveCount}
            </span>
          </button>

          {/* S3 Storage (if any) */}
          {s3Count > 0 && (
            <button
              type="button"
              onClick={() => setProviderFilter('s3')}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border",
                providerFilter === 's3'
                  ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              )}
            >
              <Database className="h-3.5 w-3.5" />
              <span>S3 Storage</span>
              <span className={cn("rounded-md px-1 py-0.2 text-[10px]", providerFilter === 's3' ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                {s3Count}
              </span>
            </button>
          )}

          {/* Account Filter dropdown */}
          {accounts.length > 1 && (
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 shadow-xs"
            >
              <option value="all">All Accounts ({accounts.length})</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sort & Search Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative min-w-[140px] sm:min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drives..."
              className="h-8 pl-8 pr-3 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setSortBy('available')}
              className={cn("rounded-lg px-2 py-1 text-[11px] font-bold transition-all", sortBy === 'available' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              title="Sort by most free space"
            >
              Most Free
            </button>
            <button
              type="button"
              onClick={() => setSortBy('used')}
              className={cn("rounded-lg px-2 py-1 text-[11px] font-bold transition-all", sortBy === 'used' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}
              title="Sort by highest usage"
            >
              Highest Used
            </button>
          </div>
        </div>
      </div>

      {/* Connected Drives Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Connected Drives</h2>
            <span className="text-xs font-semibold text-slate-400">({filteredAccounts.length} of {accounts.length})</span>
          </div>
          <Button size="sm" variant="outline" onClick={connectDrive} className="h-7 text-xs rounded-lg px-2.5 font-bold border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10">
            <Link2 className="h-3 w-3 mr-1" />Add Another Drive
          </Button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span>Loading connected storage drives...</span>
            </div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <Card className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
            <Cloud className="mx-auto h-10 w-10 text-blue-600 dark:text-blue-400 opacity-60" />
            <h3 className="mt-3 text-base font-extrabold text-slate-900 dark:text-slate-100">
              {accounts.length === 0 ? 'No Google Drive accounts connected yet' : 'No drives match the current filter'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {accounts.length === 0
                ? 'Connect your Google Drive accounts to automatically pool quota and stream large files seamlessly.'
                : 'Try clearing the search query or selecting "All Providers" to view your connected accounts.'}
            </p>
            {accounts.length === 0 ? (
              <Button onClick={connectDrive} className="mt-4 rounded-xl px-5 font-bold shadow-xs bg-blue-600 hover:bg-blue-700 text-white">
                <Link2 className="h-4 w-4 mr-1.5" />Connect Google Drive
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => { setProviderFilter('all'); setAccountFilter('all'); setSearchQuery('') }} className="mt-4 rounded-xl text-xs font-bold">
                Reset Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAccounts.map((account) => {
              const percent = pct(account)
              const badge = getStatusBadge(percent)
              const isSyncing = syncingAccountId === account.id
              const isDeleting = deletingAccountId === account.id

              return (
                <Card
                  key={account.id}
                  className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xs transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
                >
                  {/* Top Bar: Icon, Name/Email, Status & Actions */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <ProviderIcon provider={account.provider} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-100" title={account.displayName || account.email}>
                              {account.displayName || account.email.split('@')[0]}
                            </p>
                            <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="Connected & Active" />
                          </div>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400 font-mono" title={account.email}>
                            {account.email}
                          </p>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => syncAccountQuota(account.id)}
                          disabled={isSyncing}
                          className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600"
                          title="Sync quota from Google Drive"
                        >
                          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin text-blue-600")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => disconnectAccount(account.id, account.email)}
                          disabled={isDeleting}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Disconnect drive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Provider & Health Status Pills */}
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {providerLabel(account.provider)}
                      </span>
                      <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-bold", badge.bg)}>
                        {badge.label} ({percent}%)
                      </span>
                    </div>

                    {/* Storage Progress Bar */}
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", badge.bar)}
                          style={{ width: `${Math.max(2, percent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Detailed Storage Numbers */}
                    <div className="mt-2.5 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-900 dark:text-slate-100">
                        {formatBytes(getUsedBytes(account))} <span className="font-normal text-slate-400">/ {formatBytes(getTotalBytes(account))}</span>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatBytes(getAvailableBytes(account))} free
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Last Synced Time */}
                  <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Last synced:</span>
                    <span className="font-medium text-slate-500 dark:text-slate-400">
                      {account.storageAccount?.lastSyncedAt
                        ? formatDate(account.storageAccount.lastSyncedAt)
                        : 'Auto-managed'}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload Routing Policy Section */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Upload Routing Strategy</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              OmniDrive automatically routes new files across your connected drives so no single drive runs out of quota.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Routing Mode:</span>
            <select
              className="h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-xs"
              value={routingPolicy.mode}
              onChange={(e) => saveRoutingPolicy({ ...routingPolicy, mode: e.target.value as RoutingMode })}
            >
              <option value="most_available">Most Available (Auto-picks emptiest drive)</option>
              <option value="round_robin">Round Robin (Distributes evenly)</option>
              <option value="priority">Priority Order (Custom drive sequence)</option>
            </select>
          </label>
        </div>

        {/* Priority Order Account Rows */}
        <div className="mt-4 space-y-2">
          {orderedAccounts().map((account, index) => (
            <div
              key={account.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 text-xs font-black">
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{account.email}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatBytes(getUsedBytes(account))} used · {formatBytes(getAvailableBytes(account))} available
                  </p>
                </div>
              </div>

              {routingPolicy.mode === 'priority' && (
                <div className="flex items-center gap-1 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg"
                    onClick={() => moveAccountPriority(account.id, -1)}
                    disabled={index === 0}
                    title="Move up in priority"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg"
                    onClick={() => moveAccountPriority(account.id, 1)}
                    disabled={index === accounts.length - 1}
                    title="Move down in priority"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {accounts.length === 0 && (
            <p className="text-xs text-slate-400 py-2">Connect at least one Google Drive account to configure routing.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
