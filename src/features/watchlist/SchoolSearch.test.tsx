import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SchoolSearch } from './SchoolSearch'
import { WatchlistProvider } from './WatchlistContext'

vi.mock('../../data/schools-index.json', () => ({
  default: [
    { school_id: 'harvard-law', school_name: 'Harvard Law School' },
    { school_id: 'columbia-law', school_name: 'Columbia Law School' },
    { school_id: 'yale-law', school_name: 'Yale Law School' },
    { school_id: 'nyu-law', school_name: 'NYU School of Law' },
    { school_id: 'stanford-law', school_name: 'Stanford Law School' },
  ],
}))

function renderWithWatchlist(
  initialWatchlist: { school_id: string; applied_month: number | null }[] = []
) {
  if (initialWatchlist.length > 0) {
    localStorage.setItem('lst.watchlist', JSON.stringify(initialWatchlist))
  }
  return render(
    <WatchlistProvider>
      <SchoolSearch />
    </WatchlistProvider>
  )
}

describe('SchoolSearch', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders Add school button', () => {
    renderWithWatchlist()
    expect(
      screen.getByRole('button', { name: /add school/i })
    ).toBeInTheDocument()
  })

  it('opens popover on button click and shows search input', async () => {
    renderWithWatchlist()
    await userEvent.click(screen.getByRole('button', { name: /add school/i }))
    expect(screen.getByPlaceholderText(/search schools/i)).toBeInTheDocument()
  })

  it('filters results as user types', async () => {
    renderWithWatchlist()
    await userEvent.click(screen.getByRole('button', { name: /add school/i }))
    await userEvent.type(screen.getByPlaceholderText(/search schools/i), 'harv')
    expect(screen.getByText('Harvard Law School')).toBeInTheDocument()
    expect(screen.queryByText('Columbia Law School')).not.toBeInTheDocument()
  })

  it('shows "No schools match" when query has no results', async () => {
    renderWithWatchlist()
    await userEvent.click(screen.getByRole('button', { name: /add school/i }))
    await userEvent.type(
      screen.getByPlaceholderText(/search schools/i),
      'zzznotaschool'
    )
    expect(screen.getByText(/no schools match/i)).toBeInTheDocument()
  })

  it('shows checkmark for already-watchlisted school', async () => {
    renderWithWatchlist([{ school_id: 'harvard-law', applied_month: null }])
    await userEvent.click(screen.getByRole('button', { name: /add school/i }))
    await userEvent.type(screen.getByPlaceholderText(/search schools/i), 'harv')
    expect(screen.getByLabelText(/already in watchlist/i)).toBeInTheDocument()
  })

  it('transitions to month step on school selection', async () => {
    renderWithWatchlist()
    await userEvent.click(screen.getByRole('button', { name: /add school/i }))
    await userEvent.type(screen.getByPlaceholderText(/search schools/i), 'harv')
    await userEvent.click(screen.getByText('Harvard Law School'))
    expect(screen.getByLabelText(/applied month/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
  })

  it('Skip adds school with applied_month: null and closes popover', async () => {
    renderWithWatchlist()
    await userEvent.click(screen.getByRole('button', { name: /add school/i }))
    await userEvent.type(screen.getByPlaceholderText(/search schools/i), 'harv')
    await userEvent.click(screen.getByText('Harvard Law School'))
    await userEvent.click(screen.getByRole('button', { name: /skip/i }))
    const stored = JSON.parse(localStorage.getItem('lst.watchlist')!)
    expect(stored).toHaveLength(1)
    expect(stored[0]).toEqual({ school_id: 'harvard-law', applied_month: null })
    expect(
      screen.queryByPlaceholderText(/search schools/i)
    ).not.toBeInTheDocument()
  })

  it('entering valid month and clicking Add stores applied_month', async () => {
    renderWithWatchlist()
    await userEvent.click(screen.getByRole('button', { name: /add school/i }))
    await userEvent.type(screen.getByPlaceholderText(/search schools/i), 'harv')
    await userEvent.click(screen.getByText('Harvard Law School'))
    await userEvent.type(screen.getByLabelText(/applied month/i), '10')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))
    const stored = JSON.parse(localStorage.getItem('lst.watchlist')!)
    expect(stored[0]).toEqual({ school_id: 'harvard-law', applied_month: 10 })
  })

  it('shows error for invalid month (e.g. 13) and does not call addSchool', async () => {
    renderWithWatchlist()
    await userEvent.click(screen.getByRole('button', { name: /add school/i }))
    await userEvent.type(screen.getByPlaceholderText(/search schools/i), 'yale')
    await userEvent.click(screen.getByText('Yale Law School'))
    await userEvent.type(screen.getByLabelText(/applied month/i), '13')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(screen.getByText(/month must be 1.12/i)).toBeInTheDocument()
    // WatchlistProvider initializes localStorage to [] on mount; verify no school was added
    const stored = JSON.parse(localStorage.getItem('lst.watchlist') ?? '[]')
    expect(stored).toHaveLength(0)
  })

  it('works with no profile set in localStorage', async () => {
    // No ProfileProvider, no localStorage profile — must still work
    renderWithWatchlist()
    await userEvent.click(screen.getByRole('button', { name: /add school/i }))
    expect(screen.getByPlaceholderText(/search schools/i)).toBeInTheDocument()
  })
})
