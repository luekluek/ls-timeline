import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { WatchlistEntry } from '../../shared/types/watchlist'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WatchlistAction =
  | { type: 'ADD_SCHOOL'; payload: WatchlistEntry }
  | { type: 'REMOVE_SCHOOL'; payload: string }  // payload = school_id

interface WatchlistContextValue {
  watchlist: WatchlistEntry[]
  addSchool: (entry: WatchlistEntry) => void
  removeSchool: (school_id: string) => void
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function watchlistReducer(
  state: WatchlistEntry[],
  action: WatchlistAction
): WatchlistEntry[] {
  switch (action.type) {
    case 'ADD_SCHOOL':
      // Deduplicate by school_id — never add the same school twice
      if (state.some(e => e.school_id === action.payload.school_id)) return state
      return [...state, action.payload]
    case 'REMOVE_SCHOOL':
      if (!state.some(e => e.school_id === action.payload)) return state
      return state.filter(e => e.school_id !== action.payload)
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

function initWatchlist(): WatchlistEntry[] {
  try {
    const raw = localStorage.getItem('lst.watchlist')
    if (raw === null) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return (parsed as unknown[]).filter(
      (e): e is WatchlistEntry =>
        typeof e === 'object' && e !== null && typeof (e as WatchlistEntry).school_id === 'string'
    )
  } catch {
    return []
  }
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, dispatch] = useReducer(watchlistReducer, [], initWatchlist)

  useEffect(() => {
    localStorage.setItem('lst.watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  const addSchool = useCallback((entry: WatchlistEntry) => {
    dispatch({ type: 'ADD_SCHOOL', payload: entry })
  }, [])

  const removeSchool = useCallback((school_id: string) => {
    dispatch({ type: 'REMOVE_SCHOOL', payload: school_id })
  }, [])

  return (
    <WatchlistContext.Provider value={{ watchlist, addSchool, removeSchool }}>
      {children}
    </WatchlistContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext)
  if (ctx === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider')
  }
  return ctx
}
