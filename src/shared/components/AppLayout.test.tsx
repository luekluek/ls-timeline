import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { WatchlistProvider } from '@/features/watchlist'
import AppLayout from './AppLayout'

vi.mock('@/data/schools-index.json', () => ({
  default: [
    { school_id: 'harvard-law', school_name: 'Harvard Law School' },
    { school_id: 'columbia-law', school_name: 'Columbia Law School' },
    { school_id: 'yale-law', school_name: 'Yale Law School' },
    { school_id: 'nyu-law', school_name: 'NYU School of Law' },
    { school_id: 'stanford-law', school_name: 'Stanford Law School' },
  ],
}))

vi.mock('@/data/meta.json', () => ({
  default: { data_freshness: '2026-01-01' },
}))

function renderAppLayout(initialWatchlist: { school_id: string; applied_month: number | null }[] = []) {
  if (initialWatchlist.length > 0) {
    localStorage.setItem('lst.watchlist', JSON.stringify(initialWatchlist))
  }
  const router = createMemoryRouter([
    {
      element: <AppLayout />,
      children: [{ index: true, element: <div>page content</div> }],
    },
  ])
  return render(
    <WatchlistProvider>
      <RouterProvider router={router} />
    </WatchlistProvider>
  )
}

describe('AppLayout sidebar (AC #5)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows empty state text when watchlist is empty', () => {
    renderAppLayout()
    expect(screen.getByText(/add schools to track timing/i)).toBeInTheDocument()
  })

  it('always shows SchoolSearch Add button in sidebar', () => {
    renderAppLayout()
    expect(screen.getByRole('button', { name: /add school/i })).toBeInTheDocument()
  })

  it('shows school card in sidebar when watchlist has entries', () => {
    renderAppLayout([{ school_id: 'harvard-law', applied_month: null }])
    expect(screen.getByText('Harvard Law School')).toBeInTheDocument()
  })

  it('shows applied month badge in sidebar card', () => {
    renderAppLayout([{ school_id: 'harvard-law', applied_month: 10 }])
    expect(screen.getByText('Month 10')).toBeInTheDocument()
  })

  it('sidebar school card links to /school/:id', () => {
    renderAppLayout([{ school_id: 'harvard-law', applied_month: null }])
    const link = screen.getByRole('link', { name: /harvard law school/i })
    expect(link).toHaveAttribute('href', '/school/harvard-law')
  })

  it('Remove button in sidebar removes the school', async () => {
    renderAppLayout([{ school_id: 'harvard-law', applied_month: null }])
    expect(screen.getByText('Harvard Law School')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /remove harvard/i }))
    expect(screen.queryByText('Harvard Law School')).not.toBeInTheDocument()
  })

  it('falls back to school_id when school not in index', () => {
    renderAppLayout([{ school_id: 'unknown-school', applied_month: null }])
    expect(screen.getByText('unknown-school')).toBeInTheDocument()
  })
})
