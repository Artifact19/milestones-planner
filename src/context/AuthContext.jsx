import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    let mounted = true

    // Check if user landed on the page with a recovery hash
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsPasswordRecovery(true)
    }

    // Restore existing session from storage
    async function initSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error fetching session:', error.message)
        }
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Session init error:', err)
        if (mounted) setLoading(false)
      }
    }

    initSession()

    // Listen to real-time auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }
      setSession(newSession)
      setUser((prevUser) => {
        const newUser = newSession?.user ?? null
        if (!prevUser && !newUser) return null
        if (
          prevUser &&
          newUser &&
          prevUser.id === newUser.id &&
          prevUser.email === newUser.email &&
          prevUser.user_metadata?.avatar_url === newUser.user_metadata?.avatar_url
        ) {
          return prevUser // Preserve stable identity to prevent tab-switching re-render storms
        }
        return newUser
      })
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password) => {
    return await supabase.auth.signUp({ email, password })
  }

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    setIsPasswordRecovery(false)
    return await supabase.auth.signOut()
  }

  const resetPassword = async (email) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
    })
  }

  const updatePassword = async (newPassword) => {
    const res = await supabase.auth.updateUser({ password: newPassword })
    if (!res.error) {
      setIsPasswordRecovery(false)
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
    return res
  }

  const updateAvatar = async (avatarUrl) => {
    try {
      if (user?.id) {
        if (avatarUrl) {
          localStorage.setItem('user_avatar_' + user.id, avatarUrl)
        } else {
          localStorage.removeItem('user_avatar_' + user.id)
        }
      }
      const { data, error } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      })
      if (!error && data?.user) {
        setUser(data.user)
      } else if (!error && user) {
        setUser({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            avatar_url: avatarUrl
          }
        })
      }
      return { data, error }
    } catch (err) {
      return { error: err }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium tracking-wide">Loading account…</p>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      updateAvatar,
      resetPassword,
      updatePassword,
      isPasswordRecovery,
      setIsPasswordRecovery
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
