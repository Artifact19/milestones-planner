import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
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
    return await supabase.auth.signOut()
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
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updateAvatar }}>
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
