import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GoogleLogo } from '@/components/auth/GoogleLogo'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api'
import { getAccessToken, setAuthSession, type AuthUser } from '@/lib/auth'

type AuthResponse = { accessToken: string; refreshToken: string; user: AuthUser }

export function LoginPage() {
  const navigate = useNavigate()

  if (getAccessToken()) {
    return <Navigate to="/all-files" replace />
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function continueWithGoogle() {
    setGoogleLoading(true)
    setError('')
    try {
      const data = await apiFetch<{ url: string }>(`/auth/google/url?frontend_url=${encodeURIComponent(window.location.origin)}`, { skipAuth: true })
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed')
      setGoogleLoading(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', skipAuth: true, body: JSON.stringify({ email, password }) })
      setAuthSession(data.accessToken, data.refreshToken, data.user)
      navigate('/all-files', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-5 relative overflow-hidden" style={{ background: 'var(--bg-gradient, #f8fafc)' }}>
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-slate-900/10 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 mb-4">
            <img src="/logo.png" alt="OmniDrive" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Welcome to OmniDrive</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">Your high-performance multi-account Google Drive storage gateway.</p>
        </div>

        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            onClick={continueWithGoogle}
            disabled={googleLoading || loading}
          >
            <GoogleLogo className="h-4 w-4" />
            {googleLoading ? 'Connecting with Google...' : 'Continue with Google'}
          </Button>

          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/80 dark:border-slate-800" /></div>
            <span className="relative bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">or with email</span>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            Email Address
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl text-sm" />
          </label>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
              <Link to="/set-password" className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Set / Forgot password?
              </Link>
            </div>
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 rounded-xl text-sm" />
          </div>
          {error ? <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-600 dark:text-red-400">{error}</div> : null}
          <Button disabled={loading} className="h-11 rounded-xl font-bold shadow-md shadow-blue-500/25 mt-1">{loading ? 'Signing in...' : 'Sign In'}</Button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">Don't have an account? <Link to="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Register now</Link></p>
      </Card>
    </main>
  )
}
