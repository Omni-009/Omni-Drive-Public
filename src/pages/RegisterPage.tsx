import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { GoogleLogo } from '@/components/auth/GoogleLogo'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api'
import { getAccessToken, setAuthSession, type AuthUser } from '@/lib/auth'
import { cn } from '@/lib/utils'

type AuthResponse = { accessToken: string; refreshToken: string; user: AuthUser }
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim()

declare global {
  interface Window {
    grecaptcha?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => number
      reset: (widgetId?: number) => void
    }
  }
}

export function RegisterPage() {
  const navigate = useNavigate()
  if (getAccessToken()) {
    return <Navigate to="/all-files" replace />
  }

  // Form states
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const recaptchaRef = useRef<HTMLDivElement | null>(null)
  const recaptchaWidgetId = useRef<number | null>(null)

  useEffect(() => {
    if (!recaptchaSiteKey) return
    const scriptId = 'google-recaptcha-script'
    const renderCaptcha = () => {
      if (!recaptchaRef.current || !window.grecaptcha || recaptchaWidgetId.current !== null) return
      recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
        sitekey: recaptchaSiteKey,
        callback: setCaptchaToken,
        'expired-callback': () => setCaptchaToken(''),
      })
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = renderCaptcha
      document.body.appendChild(script)
    } else {
      renderCaptcha()
    }
  }, [])

  // Timer for resend button
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => setCountdown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [countdown])

  async function continueWithGoogle() {
    setGoogleLoading(true)
    setError('')
    try {
      const data = await apiFetch<{ url: string }>('/auth/google/url', { skipAuth: true })
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google register failed')
      setGoogleLoading(false)
    }
  }

  // Step 1: Send OTP to verify email
  async function handleSendOTP(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setInfoMessage('')

    if (recaptchaSiteKey && !captchaToken) {
      setError('Please complete the captcha verification.')
      setLoading(false)
      return
    }

    try {
      await apiFetch('/auth/send-otp', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() })
      })
      setStep('otp')
      setCountdown(60)
      setInfoMessage(`Verification code sent to ${email.trim()}. Please enter the 6-digit code below.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  async function handleResendOTP() {
    if (countdown > 0 || resending) return
    setResending(true)
    setError('')
    try {
      await apiFetch('/auth/send-otp', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() })
      })
      setCountdown(60)
      setInfoMessage('New verification code sent! Check your inbox.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  // Step 2: Complete Registration with OTP
  async function handleVerifyAndRegister(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const cleanOtp = otp.trim()
    if (cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit code.')
      setLoading(false)
      return
    }

    try {
      const data = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          otp: cleanOtp,
          captchaToken
        })
      })
      setAuthSession(data.accessToken, data.refreshToken, data.user)
      navigate('/all-files', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please check the code.')
      if (recaptchaWidgetId.current !== null) window.grecaptcha?.reset(recaptchaWidgetId.current)
      setCaptchaToken('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 relative overflow-hidden" style={{ background: 'var(--bg-gradient, #f8fafc)' }}>
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-slate-900/10 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 mb-3 bg-blue-600">
            <img src="/logo.png" alt="OmniDrive" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {step === 'form' ? 'Create OmniDrive Account' : 'Verify Your Email'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            {step === 'form'
              ? 'Multi-drive gateway with pooled storage and zero server bottleneck.'
              : `Enter the 6-digit verification code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/90 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {infoMessage && !error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/90 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {step === 'form' ? (
          <>
            <div className="mt-5">
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

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/80 dark:border-slate-800" /></div>
                <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">or with email</span>
              </div>
            </div>

            <form onSubmit={handleSendOTP} className="grid gap-3">
              <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Name
                <Input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10 rounded-xl text-xs sm:text-sm"
                />
              </label>

              <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Address
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 rounded-xl text-xs sm:text-sm"
                />
              </label>

              <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                Password (min 6 chars)
                <Input
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 rounded-xl text-xs sm:text-sm"
                />
              </label>

              {recaptchaSiteKey ? (
                <div className="min-h-[78px] overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800 p-2">
                  <div ref={recaptchaRef} />
                </div>
              ) : null}

              <Button disabled={loading} className="h-11 rounded-xl font-bold shadow-md shadow-blue-500/25 mt-1 bg-blue-600 hover:bg-blue-700 text-white">
                <Mail className="h-4 w-4 mr-2" />
                {loading ? 'Sending Code...' : 'Verify Email & Continue'}
              </Button>
            </form>
          </>
        ) : (
          /* Step 2: Enter 6-digit OTP */
          <form onSubmit={handleVerifyAndRegister} className="mt-5 grid gap-4">
            <div className="flex flex-col items-center gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                6-Digit Verification Code
              </label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]*"
                autoComplete="one-time-code"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="h-14 w-56 text-center text-2xl font-mono font-black tracking-[8px] rounded-2xl border-2 border-blue-500/40 focus:border-blue-500 bg-white dark:bg-slate-800 shadow-sm"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length < 6}
              className="h-11 rounded-xl font-bold shadow-md shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {loading ? 'Verifying...' : 'Complete Registration'}
            </Button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change Email
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={countdown > 0 || resending}
                className={cn(
                  "font-bold transition-colors",
                  countdown > 0
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-blue-600 dark:text-blue-400 hover:underline"
                )}
              >
                {resending ? (
                  <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Resending...</span>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  'Resend Code'
                )}
              </button>
            </div>
          </form>
        )}

        <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  )
}
