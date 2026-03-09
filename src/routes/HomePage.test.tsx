import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ProfileProvider } from '../features/profile'
import { WatchlistProvider } from '../features/watchlist'
import HomePage from './HomePage'

vi.mock('@/data/schools-index.json', () => ({
  default: [
    { school_id: 'harvard-law', school_name: 'Harvard Law School' },
    { school_id: 'columbia-law', school_name: 'Columbia Law School' },
    { school_id: 'yale-law', school_name: 'Yale Law School' },
    { school_id: 'nyu-law', school_name: 'NYU School of Law' },
    { school_id: 'stanford-law', school_name: 'Stanford Law School' },
  ],
}))

function renderHomePage(initialWatchlist: { school_id: string; applied_month: number | null }[] = []) {
  if (initialWatchlist.length > 0) {
    localStorage.setItem('lst.watchlist', JSON.stringify(initialWatchlist))
  }
  return render(
    <MemoryRouter>
      <ProfileProvider>
        <WatchlistProvider>
          <HomePage />
        </WatchlistProvider>
      </ProfileProvider>
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows empty state message when watchlist is empty', () => {
    renderHomePage()
    expect(screen.getByText(/add schools to your watchlist/i)).toBeInTheDocument()
  })

  it('shows SchoolSearch Add button when watchlist is empty', () => {
    renderHomePage()
    expect(screen.getByRole('button', { name: /add school/i })).toBeInTheDocument()
  })

  it('shows school cards when watchlist has entries', () => {
    renderHomePage([{ school_id: 'harvard-law', applied_month: null }])
    expect(screen.getByText('Harvard Law School')).toBeInTheDocument()
  })

  it('shows applied month badge when applied_month is set', () => {
    renderHomePage([{ school_id: 'harvard-law', applied_month: 10 }])
    expect(screen.getByText('Month 10')).toBeInTheDocument()
  })

  it('does NOT show month badge when applied_month is null', () => {
    renderHomePage([{ school_id: 'harvard-law', applied_month: null }])
    expect(screen.queryByText(/month \d/i)).not.toBeInTheDocument()
  })

  it('school card has a link to /school/:id', () => {
    renderHomePage([{ school_id: 'harvard-law', applied_month: null }])
    const link = screen.getByRole('link', { name: /harvard law school/i })
    expect(link).toHaveAttribute('href', '/school/harvard-law')
  })

  it('Remove button calls removeSchool and removes the card', async () => {
    renderHomePage([{ school_id: 'harvard-law', applied_month: null }])
    expect(screen.getByText('Harvard Law School')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /remove harvard/i }))
    expect(screen.queryByText('Harvard Law School')).not.toBeInTheDocument()
  })

  it('profile form is visible when profile is null (no profile set)', () => {
    renderHomePage()
    expect(screen.getByLabelText(/gpa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/lsat/i)).toBeInTheDocument()
  })

  it('restores watchlist silently from localStorage without prompts', () => {
    localStorage.setItem('lst.watchlist', JSON.stringify([
      { school_id: 'yale-law', applied_month: null },
      { school_id: 'columbia-law', applied_month: 9 },
    ]))
    renderHomePage()
    expect(screen.getByText('Yale Law School')).toBeInTheDocument()
    expect(screen.getByText('Columbia Law School')).toBeInTheDocument()
  })
})
