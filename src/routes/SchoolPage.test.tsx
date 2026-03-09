import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProfileProvider } from '@/features/profile'
import { WatchlistProvider } from '@/features/watchlist'
import SchoolPage from './SchoolPage'

// Mock the hook — control loading/data state precisely
vi.mock('@/features/school-page', () => ({
  useSchoolData: vi.fn(),
}))

import { useSchoolData } from '@/features/school-page'
const mockUseSchoolData = useSchoolData as ReturnType<typeof vi.fn>

const mockSchoolData = {
  school_id: 'columbia-university',
  school_name: 'Columbia University',
  last_cycle_km: { sparse: false, reason: null, data: { points: [], cycle_year: 2025 } },
  current_cycle_km: { sparse: false, reason: null, data: { points: [], cycle_year: 2026 } },
  cohort_histograms: {
    sparse: false,
    reason: null,
    data: [{ applied_month: 10, bins: [{ cycle_week: 24, count: 100 }], total: 200 }],
  },
  median_decision_week: { sparse: false, reason: null, data: 27 },
  current_cycle_week: 27,
}

function renderSchoolPage(
  schoolId = 'columbia-university',
  initialWatchlist: { school_id: string; applied_month: number | null }[] = [],
) {
  if (initialWatchlist.length > 0) {
    localStorage.setItem('lst.watchlist', JSON.stringify(initialWatchlist))
  }
  return render(
    <MemoryRouter initialEntries={[`/school/${schoolId}`]}>
      <ProfileProvider>
        <WatchlistProvider>
          <Routes>
            <Route path="/school/:id" element={<SchoolPage />} />
          </Routes>
        </WatchlistProvider>
      </ProfileProvider>
    </MemoryRouter>,
  )
}

describe('SchoolPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('shows skeleton shimmer when loading', () => {
    mockUseSchoolData.mockReturnValue({ data: null, loading: true, sparse: false })
    renderSchoolPage()
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows "School not found" when data is null and not loading', () => {
    mockUseSchoolData.mockReturnValue({ data: null, loading: false, sparse: false })
    renderSchoolPage('unknown-school')
    expect(screen.getByText(/school not found/i)).toBeInTheDocument()
  })

  it('shows school name when data loads', () => {
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    renderSchoolPage()
    expect(screen.getByText('Columbia University')).toBeInTheDocument()
  })

  it('shows median decision week stat card', () => {
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    renderSchoolPage()
    expect(screen.getByText('Week 27 · Apr')).toBeInTheDocument()
    expect(screen.getByText('Median decision (last cycle)')).toBeInTheDocument()
  })

  it('shows current cycle week stat card', () => {
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    renderSchoolPage()
    expect(screen.getByText('Week 27')).toBeInTheDocument()
    expect(screen.getByText('Current cycle week')).toBeInTheDocument()
  })

  it('shows — for percentile when no applied_month in watchlist', () => {
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    // no watchlist entry — applied_month will be null
    renderSchoolPage()
    expect(screen.getByText('No application month set')).toBeInTheDocument()
  })

  it('shows percentile value when applied_month is set in watchlist', () => {
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    renderSchoolPage('columbia-university', [
      { school_id: 'columbia-university', applied_month: 10 },
    ])
    // With bins: cycle_week 24 (count 100) out of 200 total, current_cycle_week=27 → 50%
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows — for median decision week when sparse', () => {
    const sparseData = {
      ...mockSchoolData,
      median_decision_week: { sparse: true, reason: 'insufficient_observations', data: null },
    }
    mockUseSchoolData.mockReturnValue({ data: sparseData, loading: false, sparse: true })
    renderSchoolPage()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
