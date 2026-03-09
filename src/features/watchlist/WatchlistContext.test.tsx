import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { WatchlistProvider, useWatchlist, watchlistReducer } from './WatchlistContext'
import type { WatchlistEntry } from '../../shared/types/watchlist'

// ---- Pure reducer tests (no render needed) ----

describe('watchlistReducer', () => {
  it('ADD_SCHOOL adds entry to empty array', () => {
    const entry: WatchlistEntry = { school_id: 'harvard-law', applied_month: 10 }
    const result = watchlistReducer([], { type: 'ADD_SCHOOL', payload: entry })
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(entry)
  })

  it('ADD_SCHOOL deduplicates by school_id', () => {
    const entry: WatchlistEntry = { school_id: 'harvard-law', applied_month: 10 }
    const state = [entry]
    const result = watchlistReducer(state, { type: 'ADD_SCHOOL', payload: entry })
    expect(result).toHaveLength(1)
    expect(result).toBe(state) // same reference — no new array
  })

  it('ADD_SCHOOL with different school_ids adds both', () => {
    const e1: WatchlistEntry = { school_id: 'harvard-law', applied_month: null }
    const e2: WatchlistEntry = { school_id: 'columbia-law', applied_month: 9 }
    const result = watchlistReducer([e1], { type: 'ADD_SCHOOL', payload: e2 })
    expect(result).toHaveLength(2)
  })

  it('REMOVE_SCHOOL removes matching entry', () => {
    const state: WatchlistEntry[] = [
      { school_id: 'harvard-law', applied_month: null },
      { school_id: 'columbia-law', applied_month: 9 },
    ]
    const result = watchlistReducer(state, { type: 'REMOVE_SCHOOL', payload: 'harvard-law' })
    expect(result).toHaveLength(1)
    expect(result[0].school_id).toBe('columbia-law')
  })

  it('REMOVE_SCHOOL with non-existent id returns same state reference', () => {
    const state: WatchlistEntry[] = [{ school_id: 'harvard-law', applied_month: null }]
    const result = watchlistReducer(state, { type: 'REMOVE_SCHOOL', payload: 'yale-law' })
    expect(result).toHaveLength(1)
    expect(result).toBe(state) // same reference — bail-out optimization
  })

  it('default action returns state unchanged', () => {
    const state: WatchlistEntry[] = [{ school_id: 'harvard-law', applied_month: null }]
    // @ts-expect-error testing unknown action type
    const result = watchlistReducer(state, { type: 'UNKNOWN' })
    expect(result).toBe(state)
  })
})

// ---- Provider integration tests ----

function WatchlistDisplay() {
  const { watchlist, addSchool, removeSchool } = useWatchlist()
  return (
    <div>
      <span data-testid="count">{watchlist.length}</span>
      <span data-testid="ids">{watchlist.map(e => e.school_id).join(',')}</span>
      <button onClick={() => addSchool({ school_id: 'harvard-law', applied_month: 10 })}>
        add harvard
      </button>
      <button onClick={() => addSchool({ school_id: 'harvard-law', applied_month: 10 })}>
        add harvard again
      </button>
      <button onClick={() => removeSchool('harvard-law')}>
        remove harvard
      </button>
    </div>
  )
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <WatchlistProvider>{children}</WatchlistProvider>
)

describe('WatchlistProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes to empty array when localStorage is empty', () => {
    render(<WatchlistDisplay />, { wrapper })
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('restores watchlist from localStorage on mount', () => {
    const seed: WatchlistEntry[] = [
      { school_id: 'harvard-law', applied_month: 10 },
      { school_id: 'columbia-law', applied_month: null },
    ]
    localStorage.setItem('lst.watchlist', JSON.stringify(seed))
    render(<WatchlistDisplay />, { wrapper })
    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.getByTestId('ids').textContent).toContain('harvard-law')
  })

  it('addSchool updates watchlist and localStorage', async () => {
    render(<WatchlistDisplay />, { wrapper })
    await act(async () => {
      screen.getByText('add harvard').click()
    })
    expect(screen.getByTestId('count').textContent).toBe('1')
    const stored = JSON.parse(localStorage.getItem('lst.watchlist')!)
    expect(stored).toHaveLength(1)
    expect(stored[0].school_id).toBe('harvard-law')
  })

  it('addSchool deduplicates — same school added twice stays once', async () => {
    render(<WatchlistDisplay />, { wrapper })
    await act(async () => {
      screen.getByText('add harvard').click()
    })
    await act(async () => {
      screen.getByText('add harvard again').click()
    })
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('removeSchool removes entry and updates localStorage', async () => {
    localStorage.setItem('lst.watchlist', JSON.stringify([
      { school_id: 'harvard-law', applied_month: 10 }
    ]))
    render(<WatchlistDisplay />, { wrapper })
    expect(screen.getByTestId('count').textContent).toBe('1')
    await act(async () => {
      screen.getByText('remove harvard').click()
    })
    expect(screen.getByTestId('count').textContent).toBe('0')
    const stored = JSON.parse(localStorage.getItem('lst.watchlist')!)
    expect(stored).toHaveLength(0)
  })

  it('gracefully falls back to [] on corrupted localStorage', () => {
    localStorage.setItem('lst.watchlist', 'not-valid-json')
    render(<WatchlistDisplay />, { wrapper })
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('gracefully falls back to [] when localStorage contains valid JSON but non-array', () => {
    localStorage.setItem('lst.watchlist', '{"school_id":"harvard-law"}')
    render(<WatchlistDisplay />, { wrapper })
    expect(screen.getByTestId('count').textContent).toBe('0')
  })

  it('filters out malformed entries when localStorage array contains invalid items', () => {
    localStorage.setItem('lst.watchlist', JSON.stringify([
      { school_id: 'harvard-law', applied_month: 10 },
      1,
      null,
      { wrong: 'shape' },
    ]))
    render(<WatchlistDisplay />, { wrapper })
    expect(screen.getByTestId('count').textContent).toBe('1')
    expect(screen.getByTestId('ids').textContent).toBe('harvard-law')
  })
})
