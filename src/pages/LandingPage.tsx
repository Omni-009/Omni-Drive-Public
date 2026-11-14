import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  PlayCircle,
  FolderPlus,
  CheckCircle2,
  ArrowRight,
  Database,
  Lock,
  Layers,
  Sparkles,
  ChevronDown,
  Moon,
  Sun,
  Code2,
  Terminal,
  Check,
  Copy,
  Folder,
  FileVideo,
  FileText,
  FileCode
} from 'lucide-react'
import { BrandLogo } from '@/components/drive/BrandLogo'
import { Button } from '@/components/ui/button'
import { getAccessToken, getStoredUser } from '@/lib/auth'

export function LandingPage({ downloadFocus = false }: { downloadFocus?: boolean }) {
  const navigate = useNavigate()
  const APK_DOWNLOAD_URL = 'https://github.com/Omni-009/Omni-Drive-Public/releases/download/v1.0.0/OmniDrive.apk'
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('omnidrive:theme') || localStorage.getItem('9drive:theme')
    if (saved === 'light' || saved === 'dark') return saved
    return 'dark'
  })

  // Storage Calculator state
  const [accountsCount, setAccountsCount] = useState<number>(5)

  // Interactive feature showcase tab
  const [activeTab, setActiveTab] = useState<'multi' | 'stream' | 'rgb' | 'media' | 'security' | 'api'>('multi')

  // FAQ accordion open states
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Copy code snippet state
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      setIsLoggedIn(true)
      setUser(getStoredUser())
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    localStorage.setItem('omnidrive:theme', theme)
    localStorage.setItem('9drive:theme', theme)
  }, [theme])

  useEffect(() => {
    if (downloadFocus) {
      const el = document.getElementById('download')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }, [downloadFocus])

  function toggleTheme() {
    setTheme(t => (t === 'light' ? 'dark' : 'light'))
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const pooledStorageGb = accountsCount * 15
  const estimatedAnnualSavings = Math.round(pooledStorageGb * 1.6)

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Dynamic ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[140px] dark:bg-blue-600/15" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[150px] dark:bg-cyan-600/15" />
        <div className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[130px] dark:bg-indigo-600/10" />
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <BrandLogo className="h-10 w-10 transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400">
                  OmniDrive
                </span>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 border border-blue-500/20">
                  v1.0.0
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500 uppercase">
                Google Cloud Storage Gateway
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              How It Works
            </a>
            <a href="#calculator" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Storage Calculator
            </a>
            <a href="#download" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Smartphone className="h-4 w-4" />
              Download APK
            </a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-600" />}
            </Button>

            {isLoggedIn ? (
              <Button
                onClick={() => navigate('/all-files')}
                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <span>{user?.name ? `${user.name.split(' ')[0]}'s Drive` : 'Dashboard'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 px-4.5"
                >
                  Get Started Free
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-md dark:border-blue-500/20 dark:bg-blue-950/60 dark:text-blue-300 mb-8 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>OmniDrive 1.0.0 • Ultra-Fast Google Drive Storage Gateway</span>
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            Unified Cloud Storage.{' '}
            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300">
              Zero Disk Limitations.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Connect unlimited Google Drive accounts into one unified, intelligent storage pool. Stream gigabytes directly to Google Drive with <b>zero local disk consumption</b>, organize files with RGB virtual folders, and access everything seamlessly on <b>Web & Android</b>.
          </p>

          {/* Dual CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={APK_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 py-4 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Smartphone className="h-5 w-5" />
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider text-emerald-200">Official Android APK</div>
                <div className="text-base font-bold">Download App (v1.0.0)</div>
              </div>
            </a>

            <Button
              onClick={() => navigate(isLoggedIn ? '/all-files' : '/login')}
              className="w-full sm:w-auto h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 shadow-xl shadow-blue-500/25 text-base flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{isLoggedIn ? 'Open Web Dashboard' : 'Launch Web App'}</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Trust Highlights */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Direct Google Drive API</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <span>TiDB Permanent Cloud DB</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" />
              <span>AES-256 Token Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-500" />
              <span>100% Free Forever Tier</span>
            </div>
          </div>

          {/* Hero Mockup Preview Card */}
          <div className="mt-16 mx-auto max-w-5xl rounded-3xl border border-slate-200/80 bg-white/70 p-3 shadow-2xl backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-900/60">
            <div className="rounded-2xl border border-slate-200/60 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-950 p-4 sm:p-6 text-left">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">omnidrive.app/all-files</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Gateway Live • TiDB Connected
                </div>
              </div>

              {/* Mock Dashboard Storage Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Pooled Quota</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">75.0 GB</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">5 Connected Google Accounts</div>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Total Used Space</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">21.8 GB</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">53.2 GB Free & Available</div>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Active Architecture</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">Zero Disk</div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">Direct HTTP Busboy Pipeline</div>
                </div>
              </div>

              {/* Mock RGB Folders */}
              <div className="mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <FolderPlus className="h-4 w-4 text-blue-500" /> Virtual RGB Folders
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30 p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">Project Alpha</div>
                      <div className="text-[11px] text-slate-500">14 files • 2.4 GB</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <FileVideo className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">4K Videos</div>
                      <div className="text-[11px] text-slate-500">6 files • 12.1 GB</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                      <FileCode className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">Source Backups</div>
                      <div className="text-[11px] text-slate-500">89 files • 650 MB</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/30 p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">Documents</div>
                      <div className="text-[11px] text-slate-500">32 files • 180 MB</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section id="features" className="relative z-10 py-20 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Core Architecture & Capabilities
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Engineered for Speed, Capacity, and Privacy
            </p>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
              Everything you need to turn standard Google Drive accounts into an enterprise-grade cloud workspace.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveTab('multi')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'multi'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Multi-Account Pooling
            </button>
            <button
              onClick={() => setActiveTab('stream')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'stream'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Zero-Disk Streaming
            </button>
            <button
              onClick={() => setActiveTab('rgb')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'rgb'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              RGB Virtual Folders
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'media'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              HD Player & Previews
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Security & TiDB
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'api'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Developer API
            </button>
          </div>

          {/* Active Tab Content Card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xl">
            {activeTab === 'multi' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 mb-4">
                    <Layers className="h-4 w-4" /> Multi-Account Unified Pool
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    Pool 2, 5, or 10+ Google Accounts into One Infinite Drive
                  </h3>
                  <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                    Every free Google account grants 15 GB of storage. OmniDrive acts as an intelligent storage router: connect multiple Google accounts via OAuth 2.0, track combined quota in real-time, and let our engine automatically route uploads to whichever drive has enough free space.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm font-semibold">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Automatic account capacity balancing & smart routing</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>1-Click Google OAuth connect without sharing raw passwords</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Sync physical files from Google Drive with 1 click</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Connected Accounts Mockup</div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">G1</div>
                      <div>
                        <div className="text-xs font-bold">work.drive@gmail.com</div>
                        <div className="text-[10px] text-slate-400">14.8 GB / 15 GB Used (98%)</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Full</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">G2</div>
                      <div>
                        <div className="text-xs font-bold">backup.media@gmail.com</div>
                        <div className="text-[10px] text-slate-400">3.2 GB / 15 GB Used (21%)</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active Route</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-xs">G3</div>
                      <div>
                        <div className="text-xs font-bold">archive.vault@gmail.com</div>
                        <div className="text-[10px] text-slate-400">0.4 GB / 15 GB Used (3%)</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active Route</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stream' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-4">
                    <Zap className="h-4 w-4" /> Zero Local Disk Footprint
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    High-Speed Busboy Streaming Directly into Google Drive
                  </h3>
                  <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                    Traditional servers download uploaded files to their local disk first before sending them to the cloud. OmniDrive uses a <b>streaming pipeline</b>: data packets fly straight through memory into the Google Drive API. Even a 5 GB 4K video uploads without consuming a single megabyte on the server disk.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm font-semibold">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Dedicated Google Drive <code>OmniDrive</code> root vault folder</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Chunked multipart upload with live percentage progress bar</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Supports 5GB+ large files, archives, and ISOs without timeout</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <span className="p-3 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">Client App</span>
                    <ArrowRight className="h-5 w-5 text-slate-400" />
                    <span className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">Go Gin Streamer</span>
                    <ArrowRight className="h-5 w-5 text-slate-400" />
                    <span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Google Drive API</span>
                  </div>
                  <div className="mt-6 text-xs text-slate-500 max-w-sm">
                    <b>Zero Disk Write:</b> Packets are piped in memory using Google resumable upload sessions.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rgb' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                    <FolderPlus className="h-4 w-4" /> Visual Organization
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    RGB Color Tags, Custom Icons, and Virtual Hierarchy
                  </h3>
                  <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                    Google Drive keeps files in one safe dedicated folder, while OmniDrive provides a rich virtual folder tree in your database. Assign 16+ vibrant RGB color bars and 40+ custom icons to organize projects by client, priority, or content type.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm font-semibold">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>RGB color bar with instant visual tagging</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Organized scrollable icon picker with 40+ distinct symbols</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Instant subfolder navigation and drag-and-drop support</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Color Palette Showcase</div>
                  <div className="flex items-center gap-2 mb-4">
                    {['#2563EB', '#16A34A', '#06B6D4', '#EAB308', '#F97316', '#EF4444', '#9333EA', '#14B8A6'].map((color) => (
                      <div key={color} className="h-8 w-8 rounded-xl shadow-sm cursor-pointer transition-transform hover:scale-110" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="h-2 rounded-full bg-blue-600 mb-3" />
                    <div className="text-sm font-bold">Marketing Assets 2026</div>
                    <div className="text-xs text-slate-500 mt-1">Virtual subfolders, custom tags, and instant search.</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 mb-4">
                    <PlayCircle className="h-4 w-4" /> In-Browser Streaming
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    High-Definition Video Streaming & Document Previews
                  </h3>
                  <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                    Preview videos without downloading! Our integrated Plyr high-performance video player supports custom speeds (0.5x to 2x), subtitles, fullscreen mode, and range request streaming. Also includes built-in PDF viewer, image lightbox, audio player, and code editor.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm font-semibold">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Instant HTTP Range video streaming from Google Drive</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>High-resolution zoomable image gallery</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Syntax highlighted preview for JSON, JS, Python, Go, and SQL</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-6 text-white text-center">
                  <div className="aspect-video rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-4">
                    <PlayCircle className="h-16 w-16 text-blue-500 hover:scale-110 transition-transform cursor-pointer" />
                    <div className="text-xs font-semibold mt-3 text-slate-300">Cinematic 4K Trailer.mp4</div>
                    <div className="text-[10px] text-slate-500">HTTP 206 Partial Content • Direct Stream</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-4">
                    <ShieldCheck className="h-4 w-4" /> Enterprise Security
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    TiDB Cloud Serverless & AES-256 Encryption
                  </h3>
                  <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                    Your privacy and data safety are built-in from day one. All Google OAuth tokens are encrypted at rest using AES-256 before storage. All user sessions, folders, and file records are permanently preserved on <b>TiDB Cloud Serverless</b>, ensuring 99.99% availability with zero data loss.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm font-semibold">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>TiDB Cloud Serverless MySQL Database (Free Forever)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Argon2id password hashing & JWT bearer authentication</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Signed temporary preview tokens with automated expiry</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <Database className="h-6 w-6 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold">TiDB Cloud Serverless</div>
                      <div className="text-[10px] text-slate-500">Auto-scaling MySQL • Multi-AZ redundancy</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <Lock className="h-6 w-6 text-blue-500" />
                    <div>
                      <div className="text-xs font-bold">AES-256-GCM Token Encryption</div>
                      <div className="text-[10px] text-slate-500">Google refresh tokens encrypted at rest</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-indigo-500" />
                    <div>
                      <div className="text-xs font-bold">Scoped Google Permissions</div>
                      <div className="text-[10px] text-slate-500">Only accesses dedicated <code>OmniDrive</code> app folder</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-4">
                    <Code2 className="h-4 w-4" /> Developer Platform
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    Full REST API for Custom Scripts & Automation
                  </h3>
                  <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                    Manage storage programmatically! Generate secure API keys inside your dashboard and upload files, list folders, stream media, or trigger Google Drive quota synchronization using Python, cURL, Node.js, or Go.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm font-semibold">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Simple Bearer Token authentication via API keys</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Multipart streaming endpoint: <code>POST /uploads</code></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>Ready-to-use cURL, Python, and JS code examples</span>
                    </li>
                  </ul>
                </div>
                <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                      <span>cURL Upload Example</span>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(`curl -X POST "https://server-omni-drive.onrender.com/uploads" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -F "filesMeta=[{\\"fieldName\\":\\"file-0\\",\\"fileName\\":\\"backup.zip\\"}]" \\\n  -F "file-0=@backup.zip"`)
                      }
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-[11px] text-cyan-300 leading-relaxed">
{`curl -X POST "https://server-omni-drive.onrender.com/uploads" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F 'filesMeta=[{"fieldName":"file-0","fileName":"backup.zip"}]' \\
  -F 'file-0=@backup.zip'`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Storage Calculator Section */}
      <section id="calculator" className="relative z-10 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-cyan-50/40 p-8 sm:p-12 dark:border-slate-800/80 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 shadow-2xl backdrop-blur-xl">
            <div className="text-center max-w-2xl mx-auto">
              <span className="rounded-full bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Live Interactive Calculator
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-black">
                How Much Free Storage Can You Pool?
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Slide to select the number of personal or team Google accounts you have:
              </p>
            </div>

            {/* Slider */}
            <div className="mt-10 max-w-xl mx-auto">
              <div className="flex items-center justify-between text-sm font-bold mb-3">
                <span>Google Accounts:</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">{accountsCount} Accounts</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={accountsCount}
                onChange={(e) => setAccountsCount(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
                <span>1 Account (15 GB)</span>
                <span>10 Accounts (150 GB)</span>
                <span>20 Accounts (300 GB)</span>
              </div>
            </div>

            {/* Calculation Results Card */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs text-slate-500 font-semibold uppercase">Total Pooled Storage</div>
                <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  {pooledStorageGb} GB
                </div>
                <div className="text-xs text-slate-500 mt-1">100% Free Forever</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs text-slate-500 font-semibold uppercase">Traditional Cloud Cost</div>
                <div className="text-3xl sm:text-4xl font-black text-rose-500 mt-1">
                  ${Math.round(pooledStorageGb * 0.13)}/mo
                </div>
                <div className="text-xs text-slate-500 mt-1">Typical Dropbox/Drive sub</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs text-slate-500 font-semibold uppercase">Annual Savings</div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-500 mt-1">
                  ${estimatedAnnualSavings}/yr
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">Saved in your pocket!</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section id="how-it-works" className="relative z-10 py-20 bg-slate-100/50 dark:bg-slate-900/30 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Simple 3-Step Workflow
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Up and Running in Less Than 60 Seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold">Connect Google Accounts</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sign in with Google or connect multiple Drive accounts in Settings. Official OAuth 2.0 ensures your login credentials are never shared.
              </p>
            </div>

            <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold">Upload Any File or Folder</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Drag and drop videos, photos, code, or archives. OmniDrive automatically routes the file to the drive with the most free space.
              </p>
            </div>

            <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold">Stream, Share & Organize</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Stream 4K videos in-browser, generate expiring public links, tag with RGB colors, and access seamlessly on your Android phone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated App Download Section */}
      <section id="download" className="relative z-10 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-8 sm:p-14 text-white shadow-2xl overflow-hidden">
            {/* Ambient emerald glow */}
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30 mb-6">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Native Android Release APK</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  Get OmniDrive on Your Android Device
                </h2>

                <p className="mt-4 text-base text-slate-300 leading-relaxed">
                  Enjoy hardware-accelerated 120Hz smooth browsing, native dark theme, instant session persistence, and direct background file streaming straight from your phone.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <a
                    href={APK_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-4.5 text-base shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.03] active:scale-[0.98]"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download APK (v1.0.0)</span>
                  </a>

                  <div className="flex flex-col text-xs text-slate-400 justify-center">
                    <span className="font-semibold text-white">Size: ~4.46 MB • Direct GitHub Release</span>
                    <span>Requires Android 8.0 (Oreo) or higher</span>
                  </div>
                </div>

                {/* 3 Step Android Install Instructions */}
                <div className="mt-10 pt-8 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
                  <div>
                    <span className="font-bold text-emerald-400">Step 1:</span> Click Download APK (or scan the QR Code on mobile).
                  </div>
                  <div>
                    <span className="font-bold text-emerald-400">Step 2:</span> Open the file and tap 'Install' (Allow unknown sources if asked).
                  </div>
                  <div>
                    <span className="font-bold text-emerald-400">Step 3:</span> Sign in and access your unified Google Drive!
                  </div>
                </div>
              </div>

              {/* QR Code Card for Mobile Scanning */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 text-center shadow-xl backdrop-blur-xl max-w-xs w-full">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Scan to Install on Mobile
                  </div>
                  {/* Clean QR code image pointing directly to GitHub Release download */}
                  <div className="mx-auto h-48 w-48 rounded-xl bg-white p-2.5 shadow-md flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        APK_DOWNLOAD_URL
                      )}`}
                      alt="Scan to download OmniDrive.apk"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="mt-4 text-[11px] text-slate-400">
                    Point your Android camera at the QR code to download directly on your phone.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section id="faq" className="relative z-10 py-20 bg-slate-100/50 dark:bg-slate-900/30 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Got Questions?
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Are my files and Google accounts safe with OmniDrive?',
                a: 'Yes, 100%. OmniDrive connects using official Google OAuth 2.0 scopes. Your Google passwords are never seen or stored. All OAuth access tokens are encrypted with AES-256 before being stored in our permanent TiDB Cloud database.'
              },
              {
                q: 'Does OmniDrive store my uploaded files on its server?',
                a: 'Never. OmniDrive uses a zero-disk streaming architecture. Files are streamed in-memory via high-speed HTTP chunk pipes straight into your personal Google Drive dedicated `OmniDrive` folder. Nothing touches local server disk.'
              },
              {
                q: 'How many Google Drive accounts can I connect?',
                a: 'There is no hard limit! You can connect 2, 5, 10, or more Google accounts. OmniDrive pools all their individual 15 GB quotas into one combined view and automatically routes uploads to the drive with available space.'
              },
              {
                q: 'Will my files disappear if Render server sleeps or restarts?',
                a: 'No! All database records, user accounts, virtual folders, and Google tokens are permanently stored in TiDB Cloud Serverless (MySQL). Even if Render sleeps, all your data remains 100% persistent.'
              },
              {
                q: 'How do I download and install the Android app?',
                a: 'Simply click the "Download APK" button on this website or scan the QR code with your Android camera. Once downloaded, open `OmniDrive.apk` and tap Install. The app works on Android 8.0 and above.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left font-bold text-base sm:text-lg"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      openFaq === idx ? 'rotate-180 text-blue-500' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 sm:px-6 pb-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative z-10 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-10 sm:p-16 text-white shadow-2xl shadow-blue-500/25">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Ready to Unite Your Cloud Storage?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-blue-100">
              Start pooling multiple Google Drive accounts for free today. Available everywhere on Web & Android.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate(isLoggedIn ? '/all-files' : '/register')}
                className="w-full sm:w-auto h-13 rounded-2xl bg-white text-blue-700 hover:bg-slate-100 font-bold px-8 text-base shadow-lg transition-transform hover:scale-105"
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Create Free Account'}
              </Button>
              <a
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950/40 hover:bg-slate-950/60 text-white font-bold px-7 py-3.5 text-base border border-white/20 transition-transform hover:scale-105"
              >
                <Smartphone className="h-5 w-5" />
                <span>Download Android APK (v1.0.0)</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white py-12 dark:border-slate-800/80 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-8 w-8" />
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">OmniDrive</div>
              <div className="text-[11px]">Intelligent Multi-Cloud Storage Gateway</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <a href="#features" className="hover:text-blue-500 transition-colors">Features</a>
            <a href="#calculator" className="hover:text-blue-500 transition-colors">Calculator</a>
            <a href="#download" className="hover:text-blue-500 transition-colors">Android App</a>
            <a href="#faq" className="hover:text-blue-500 transition-colors">FAQ</a>
            <Link to="/login" className="hover:text-blue-500 transition-colors">Sign In</Link>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>TiDB & Cloudflare Operational • v1.0.0</span>
          </div>
        </div>
        <div className="mt-8 text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} OmniDrive Gateway. All files are securely streamed and stored within your personal Google Drive accounts.
        </div>
      </footer>
    </div>
  )
}
