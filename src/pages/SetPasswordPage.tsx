import { type FormEvent, useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Key, Mail, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { API_URL, apiFetch } from '@/lib/api'
import { getAccessToken, getStoredUser, setAuthSession } from '@/lib/auth'

export function SetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const storedUser = getStoredUser()
  const isLoggedIn = Boolean(storedUser && getAccessToken())

  // Authenticated state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Unauthenticated OTP reset state
  const [step, setStep] = useState<'email' | 'otp'>(isLoggedIn ? 'email' : 'email')
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [otp, setOtp] = useState('')
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    let interval: any
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  // Logged-in direct password update
  async function handleSetPasswordAuth(e: FormEvent) {
    e.preventDefault()
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    try {
      await apiFetch('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      })
      setSuccess(true)
      setMessage('Password successfully set! You can now log in with your email and password.')
    } catch (err: any) {
      setError(err.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  // Unauthenticated: Send OTP via heyeveyka@gmail.com
  async function handleSendOTP(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'set_password' }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification code')
      }

      setStep('otp')
      setTimer(60)
      setMessage(`Verification code sent to ${email} from heyeveyka@gmail.com`)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Unauthenticated: Verify OTP and reset password
  async function handleResetWithOTP(e: FormEvent) {
    e.preventDefault()
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to set password')
      }

      // If tokens returned, log the user in immediately
      if (data.tokens && data.user) {
        setAuthSession(data.tokens.accessToken, data.tokens.refreshToken, data.user)
      }

      setSuccess(true)
      setMessage('Password set successfully! Redirecting to your files...')
      setTimeout(() => {
        navigate('/all-files')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Card className="w-full max-w-md p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-md shadow-blue-500/20 mb-3">
            <Key className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Set Account Password</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            {isLoggedIn
              ? 'Set or change your OmniDrive password to enable email & password sign-in anytime.'
              : 'Verify your email to set a secure password for your OmniDrive account.'}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {success ? (
          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="w-full h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate('/all-files')}
            >
              Go to All Files <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl font-bold"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </div>
        ) : isLoggedIn ? (
          /* Logged In Flow: Directly set password */
          <form onSubmit={handleSetPasswordAuth} className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Account Email</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{storedUser?.email}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password</label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm Password</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white mt-2"
            >
              {loading ? 'Saving...' : 'Save New Password'}
            </Button>

            <div className="text-center pt-2">
              <Link to="/all-files" className="text-xs font-bold text-slate-500 hover:text-blue-600">
                Cancel & Return
              </Link>
            </div>
          </form>
        ) : step === 'email' ? (
          /* Step 1: Unauthenticated email input */
          <form onSubmit={handleSendOTP} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enter Your Account Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                OTP will be delivered from <span className="font-semibold text-slate-700 dark:text-slate-300">heyeveyka@gmail.com</span>
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white mt-2"
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-bold text-blue-600 hover:underline">
                Remember your password? Log In
              </Link>
            </div>
          </form>
        ) : (
          /* Step 2: Enter OTP + New Password */
          <form onSubmit={handleResetWithOTP} className="mt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Verification Code</label>
                {timer > 0 ? (
                  <span className="text-[11px] font-mono text-slate-400">Resend in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
              <Input
                type="text"
                required
                maxLength={6}
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1 text-center font-mono text-lg font-black tracking-widest"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">New Password</label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Confirm Password</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white mt-2"
            >
              {loading ? 'Updating Password...' : 'Save Password & Log In'}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Change Email Address
              </button>
            </div>
          </form>
        )}
      </Card>
    </main>
  )
}
