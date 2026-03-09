import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProfileProvider } from '@/features/profile'
import { WatchlistProvider } from '@/features/watchlist'
import SchoolPage from './SchoolPage'

// Mock useResizeObserver so KaplanMeierChart and HistogramChart render SVG content
vi.mock('@/shared/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/hooks')>()
  return {
    ...actual,
    useResizeObserver: vi.fn().mockReturnValue({ width: 400, height: 200 }),
  }
})

// Mock only useSchoolData — keep actual CohortHistogram, PercentileBar, DualKMPanel etc.
vi.mock('@/features/school-page', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/school-page')>()
  return {
    ...actual,
    useSchoolData: vi.fn(),
  }
})

import { useSchoolData } from '@/features/school-page'
const mockUseSchoolData = useSchoolData as ReturnType<typeof vi.fn>

const mockSchoolData = {
  school_id: 'columbia-university',
  school_name: 'Columbia University',
  last_cycle_km: {
    sparse: false,
    reason: null,
    data: {
      points: [
        { cycle_week: 10, survival: 1.0 },
        { cycle_week: 20, survival: 0.8 },
        { cycle_week: 30, survival: 0.5 },
      ],
      cycle_year: 2024,
    },
  },
  current_cycle_km: {
    sparse: false,
    reason: null,
    data: {
      points: [
        { cycle_week: 10, survival: 1.0 },
        { cycle_week: 15, survival: 0.9 },
      ],
      cycle_year: 2025,
    },
  },
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
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(3)
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
    // Both the stat card and ExpectedDecisionLabel render formatCycleWeek(27) — at least one present
    expect(screen.getAllByText('Week 27 · Mar').length).toBeGreaterThanOrEqual(1)
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

  // --- New tests for Epic 4 assembly (Story 4.5) ---

  it('renders mobile back link pointing to home (AC#7)', () => {
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    renderSchoolPage()
    const backLink = screen.getByText('← My Schools')
    expect(backLink.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders DualKMPanel with two role="img" charts', () => {
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    const { container } = renderSchoolPage()
    // HistogramChart also has role="img" — DualKMPanel adds 2 more
    const charts = container.querySelectorAll('[role="img"]')
    expect(charts.length).toBeGreaterThanOrEqual(2)
  })

  it('renders PhasePlaceholder unconditionally (FR38)', () => {
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    renderSchoolPage()
    expect(
      screen.getByText('Enter your GPA and LSAT to see outcome predictions'),
    ).toBeInTheDocument()
  })

  it('renders PercentileBar (role="meter") when applied_month is set', () => {
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    const { container } = renderSchoolPage('columbia-university', [
      { school_id: 'columbia-university', applied_month: 10 },
    ])
    expect(container.querySelector('[role="meter"]')).toBeInTheDocument()
  })

  it('does not render PercentileBar when no applied_month', () => {
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    // no watchlist entry → applied_month is null
    const { container } = renderSchoolPage()
    expect(container.querySelector('[role="meter"]')).not.toBeInTheDocument()
  })

  it('does not render PercentileBar when cohort_histograms is sparse', () => {
    const sparseHistData = {
      ...mockSchoolData,
      cohort_histograms: { sparse: true, reason: 'insufficient_observations', data: null },
    }
    mockUseSchoolData.mockReturnValue({ data: sparseHistData, loading: false, sparse: false })
    const { container } = renderSchoolPage('columbia-university', [
      { school_id: 'columbia-university', applied_month: 10 },
    ])
    expect(container.querySelector('[role="meter"]')).not.toBeInTheDocument()
  })

  it('renders timing sections without any watchlist/profile (FR37)', () => {
    // Visitor with empty watchlist — no applied_month, no profile
    mockUseSchoolData.mockReturnValue({ data: mockSchoolData, loading: false, sparse: false })
    const { container } = renderSchoolPage('columbia-university', [])
    // KM charts render regardless of profile (FR37)
    const charts = container.querySelectorAll('[role="img"]')
    expect(charts.length).toBeGreaterThanOrEqual(2)
    // Phase 2 placeholder renders regardless (FR38)
    expect(
      screen.getByText('Enter your GPA and LSAT to see outcome predictions'),
    ).toBeInTheDocument()
  })
})
