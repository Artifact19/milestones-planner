import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, ArrowRight, Loader2, KeyRound, ArrowLeft } from 'lucide-react'

export default function AuthPage() {
  const {
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    isPasswordRecovery,
    setIsPasswordRecovery
  } = useAuth()

  // modes: 'signin' | 'signup' | 'forgot' | 'reset'
  const [mode, setMode] = useState(isPasswordRecovery ? 'reset' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('reset')
      setErrorMessage('')
      setInfoMessage('')
    }
  }, [isPasswordRecovery])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    const trimmedEmail = email.trim()

    // 1. FORGOT PASSWORD MODE
    if (mode === 'forgot') {
      if (!trimmedEmail) {
        setErrorMessage('Please enter your email address.')
        return
      }
      if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        setErrorMessage('Please enter a valid email address.')
        return
      }

      setLoading(true)
      try {
        const { error } = await resetPassword(trimmedEmail)
        if (error) {
          if (error.message?.includes('Unregistered API key')) {
            setErrorMessage('Supabase API key is invalid or not found. Check your Vercel VITE_SUPABASE_ANON_KEY and redeploy.')
          } else {
            setErrorMessage(error.message)
          }
        } else {
          setInfoMessage('Password reset link sent! Check your email inbox to reset your password.')
        }
      } catch (err) {
        setErrorMessage(err.message || 'An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
      return
    }

    // 2. SET NEW PASSWORD MODE (From recovery email link)
    if (mode === 'reset') {
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.')
        return
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.')
        return
      }

      setLoading(true)
      try {
        const { error } = await updatePassword(password)
        if (error) {
          setErrorMessage(error.message)
        } else {
          setInfoMessage('Password updated successfully! Logging you in…')
          setTimeout(() => {
            setIsPasswordRecovery(false)
            setMode('signin')
          }, 1200)
        }
      } catch (err) {
        setErrorMessage(err.message || 'Failed to update password.')
      } finally {
        setLoading(false)
      }
      return
    }

    // 3. SIGN IN OR SIGN UP MODE
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(trimmedEmail, password)
        if (error) {
          if (error.message?.includes('Unregistered API key')) {
            setErrorMessage('Supabase API key is invalid or expired. Check your Vercel VITE_SUPABASE_ANON_KEY and redeploy.')
          } else {
            setErrorMessage(error.message)
          }
        } else if (data?.user && !data.session) {
          setInfoMessage('Account created! Please check your email to confirm your account, then sign in.')
        }
      } else {
        const { error } = await signIn(trimmedEmail, password)
        if (error) {
          if (error.message?.includes('Invalid login credentials')) {
            setErrorMessage('Invalid email or password. Please try again.')
          } else if (error.message?.includes('Unregistered API key')) {
            setErrorMessage('Supabase API key is invalid or revoked. Please verify your VITE_SUPABASE_ANON_KEY in Vercel settings and trigger a Redeploy.')
          } else {
            setErrorMessage(error.message)
          }
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setErrorMessage('')
    setInfoMessage('')
  }

  return (
    <div className="min-h-screen bg-[#F2EFE9] flex flex-col justify-center items-center px-4 py-12 selection:bg-[#1C1917] selection:text-white">
      <div className="w-full max-w-md">
        {/* Monogram & Title Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#E5E0D8] p-2 flex items-center justify-center mb-4 shadow-xl shadow-stone-900/5 overflow-hidden">
            <img
              src="/favicon.png"
              alt="Milestones App Icon"
              className="w-full h-full object-contain [image-rendering:pixelated]"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917]">
            Milestones
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#78716C] mt-1 font-semibold">
            Architectural Weekly Planner
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 border border-[#E5E0D8] rounded-3xl p-7 sm:p-9 shadow-[0_16px_40px_-10px_rgba(28,25,23,0.06)]">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium leading-relaxed">
              {errorMessage}
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium leading-relaxed">
              {infoMessage}
            </div>
          )}

          {/* Mode Subheadings */}
          {mode === 'forgot' && (
            <div className="mb-5">
              <h2 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#78716C]" />
                Reset Password
              </h2>
              <p className="text-xs text-[#78716C] mt-1">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>
          )}

          {mode === 'reset' && (
            <div className="mb-5">
              <h2 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#78716C]" />
                Set New Password
              </h2>
              <p className="text-xs text-[#78716C] mt-1">
                Enter your new password below to finish resetting your credentials.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field (shown in signin, signup, forgot) */}
            {mode !== 'reset' && (
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl text-[#1C1917] placeholder-stone-400 text-sm focus:outline-none focus:border-[#1C1917] focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* Password Field (shown in signin, signup, reset) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password-input"
                    className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider"
                  >
                    {mode === 'reset' ? 'New Password' : 'Password'}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] font-semibold text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl text-[#1C1917] placeholder-stone-400 text-sm focus:outline-none focus:border-[#1C1917] focus:bg-white transition-all"
                  />
                </div>
                {(mode === 'signup' || mode === 'reset') && (
                  <p className="text-xs text-[#78716C] mt-1.5">Must be at least 6 characters</p>
                )}
              </div>
            )}

            {/* Confirm Password Field (shown only in reset mode) */}
            {mode === 'reset' && (
              <div>
                <label
                  htmlFor="confirm-password-input"
                  className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl text-[#1C1917] placeholder-stone-400 text-sm focus:outline-none focus:border-[#1C1917] focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 bg-[#1C1917] hover:bg-black text-[#FAF8F5] font-semibold rounded-full text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-900/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {mode === 'signup' && 'Creating account…'}
                    {mode === 'signin' && 'Signing in…'}
                    {mode === 'forgot' && 'Sending reset link…'}
                    {mode === 'reset' && 'Updating password…'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'signin' && 'Sign In'}
                    {mode === 'forgot' && 'Send Reset Link'}
                    {mode === 'reset' && 'Update Password'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Navigation Links */}
          <div className="mt-6 pt-5 border-t border-[#E5E0D8] text-center">
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-xs text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
              >
                Don't have an account? <span className="font-semibold text-[#1C1917] underline underline-offset-4">Sign up</span>
              </button>
            )}

            {mode === 'signup' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-xs text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
              >
                Already have an account? <span className="font-semibold text-[#1C1917] underline underline-offset-4">Sign in</span>
              </button>
            )}

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-xs text-[#78716C] hover:text-[#1C1917] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            )}

            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => {
                  setIsPasswordRecovery(false)
                  switchMode('signin')
                }}
                className="text-xs text-[#78716C] hover:text-[#1C1917] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel & Back to Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
