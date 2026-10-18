import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setInfoMessage('')

    const trimmedEmail = email.trim()
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
      if (isSignUp) {
        const { data, error } = await signUp(trimmedEmail, password)
        if (error) {
          setErrorMessage(error.message)
        } else if (data?.user && !data.session) {
          setInfoMessage('Account created! Please check your email to confirm your account, then sign in.')
        }
      } else {
        const { error } = await signIn(trimmedEmail, password)
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('Invalid email or password. Please try again.')
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

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
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
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label
                htmlFor="password-input"
                className="block text-[11px] font-bold text-[#78716C] uppercase tracking-wider mb-2"
              >
                Password
              </label>
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
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl text-[#1C1917] placeholder-stone-400 text-sm focus:outline-none focus:border-[#1C1917] focus:bg-white transition-all"
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-[#78716C] mt-1.5">Must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 bg-[#1C1917] hover:bg-black text-[#FAF8F5] font-semibold rounded-full text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-900/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isSignUp ? 'Creating account…' : 'Signing in…'}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-6 pt-5 border-t border-[#E5E0D8] text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-xs text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              {isSignUp ? (
                <>Already have an account? <span className="font-semibold text-[#1C1917] underline underline-offset-4">Sign in</span></>
              ) : (
                <>Don't have an account? <span className="font-semibold text-[#1C1917] underline underline-offset-4">Sign up</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
