import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { fetchProfile as apiFetchProfile } from '../services/api'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    return window.location.hash.includes('type=recovery') || window.location.search.includes('tab=reset-password')
  })
  const lastUserIdRef = React.useRef(null)

  const fetchProfile = async (userId, isInitial = false) => {
    const shouldShowLoader = !userProfile || isInitial
    if (shouldShowLoader) setIsProfileLoading(true)
    try {
      const data = await apiFetchProfile(userId)
      setUserProfile(data || { full_name: null })
      lastUserIdRef.current = userId
    } catch {
      if (!userProfile) setUserProfile({ full_name: null })
    } finally {
      setIsProfileLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id, true)
      } else {
        setIsProfileLoading(false)
      }
      setIsAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }
      const hasUserChanged = newSession?.user?.id !== lastUserIdRef.current
      setSession(newSession)
      setIsAuthLoading(false)
      if (newSession) {
        if (hasUserChanged) fetchProfile(newSession.user.id)
      } else {
        setUserProfile(null)
        lastUserIdRef.current = null
        setIsProfileLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const isAdmin = Boolean(session?.user?.app_metadata?.role === 'admin')
  const isProfileComplete = Boolean(userProfile?.full_name)

  return (
    <AuthContext.Provider value={{
      session,
      userProfile,
      isAdmin,
      isProfileComplete,
      isAuthLoading,
      isProfileLoading,
      isPasswordRecovery,
      setIsPasswordRecovery,
      logout,
      fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
