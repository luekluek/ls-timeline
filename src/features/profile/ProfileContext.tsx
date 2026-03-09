import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { useLocalStorage } from '../../shared/hooks/useLocalStorage'
import type { UserProfile } from '../../shared/types/profile'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProfileAction = { type: 'SET_PROFILE'; payload: UserProfile | null }

interface ProfileContextValue {
  profile: UserProfile | null
  setProfile: (p: UserProfile | null) => void
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function profileReducer(
  state: UserProfile | null,
  action: ProfileAction
): UserProfile | null {
  switch (action.type) {
    case 'SET_PROFILE':
      return action.payload
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const ProfileContext = createContext<ProfileContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [, setStoredProfile, clearStoredProfile] = useLocalStorage<UserProfile>('profile')

  const [profile, dispatch] = useReducer(
    profileReducer,
    null,
    () => {
      // Lazy initializer — runs once on mount; cannot call hooks here
      try {
        const raw = localStorage.getItem('lst.profile')
        if (raw === null) return null
        return JSON.parse(raw) as UserProfile
      } catch {
        return null
      }
    }
  )

  useEffect(() => {
    if (profile === null) {
      clearStoredProfile()
    } else {
      setStoredProfile(profile)
    }
  }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  const setProfile = useCallback((p: UserProfile | null) => {
    dispatch({ type: 'SET_PROFILE', payload: p })
  }, [])

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (ctx === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return ctx
}
