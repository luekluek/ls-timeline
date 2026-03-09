import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { profileReducer, ProfileProvider, useProfile } from './ProfileContext'
import type { UserProfile } from '../../shared/types/profile'

// ---------------------------------------------------------------------------
// Reducer unit tests (pure function — no React rendering needed)
// ---------------------------------------------------------------------------

describe('profileReducer', () => {
  it('SET_PROFILE sets a valid profile', () => {
    const result = profileReducer(null, {
      type: 'SET_PROFILE',
      payload: { gpa: 3.8, lsat: 172 },
    })
    expect(result).toEqual({ gpa: 3.8, lsat: 172 })
  })

  it('SET_PROFILE with null clears the profile', () => {
    const initial: UserProfile = { gpa: 3.8, lsat: 172 }
    const result = profileReducer(initial, { type: 'SET_PROFILE', payload: null })
    expect(result).toBeNull()
  })

  it('null initial state — reducer returns null as default', () => {
    const result = profileReducer(null, { type: 'SET_PROFILE', payload: null })
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Integration tests via renderHook
// ---------------------------------------------------------------------------

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProfileProvider>{children}</ProfileProvider>
)

describe('ProfileProvider + useProfile', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes profile to null when localStorage is empty', () => {
    const { result } = renderHook(() => useProfile(), { wrapper })
    expect(result.current.profile).toBeNull()
  })

  it('setProfile updates profile state', () => {
    const { result } = renderHook(() => useProfile(), { wrapper })

    act(() => {
      result.current.setProfile({ gpa: 3.5, lsat: 165 })
    })

    expect(result.current.profile).toEqual({ gpa: 3.5, lsat: 165 })
  })

  it('setProfile writes to localStorage', () => {
    const { result } = renderHook(() => useProfile(), { wrapper })

    act(() => {
      result.current.setProfile({ gpa: 3.5, lsat: 165 })
    })

    expect(localStorage.getItem('lst.profile')).toBe(
      JSON.stringify({ gpa: 3.5, lsat: 165 })
    )
  })

  it('reads pre-seeded profile from localStorage on mount', () => {
    const seeded: UserProfile = { gpa: 3.9, lsat: 178 }
    localStorage.setItem('lst.profile', JSON.stringify(seeded))

    const { result } = renderHook(() => useProfile(), { wrapper })

    expect(result.current.profile).toEqual(seeded)
  })

  it('setProfile(null) clears localStorage', () => {
    localStorage.setItem('lst.profile', JSON.stringify({ gpa: 3.8, lsat: 172 }))
    const { result } = renderHook(() => useProfile(), { wrapper })

    act(() => {
      result.current.setProfile(null)
    })

    expect(result.current.profile).toBeNull()
    expect(localStorage.getItem('lst.profile')).toBeNull()
  })

  it('gracefully initializes to null when localStorage.getItem throws', () => {
    // Simulate a broken localStorage by making getItem throw
    const originalGetItem = localStorage.getItem.bind(localStorage)
    localStorage.getItem = () => { throw new Error('storage unavailable') }

    const { result } = renderHook(() => useProfile(), { wrapper })
    expect(result.current.profile).toBeNull()

    // Restore
    localStorage.getItem = originalGetItem
  })
})

describe('useProfile outside provider', () => {
  it('throws when used outside ProfileProvider', () => {
    // Suppress the expected React error boundary output
    const consoleError = console.error
    console.error = () => {}

    expect(() => {
      renderHook(() => useProfile())
    }).toThrow()

    console.error = consoleError
  })
})
