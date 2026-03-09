import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { CohortHistogramData, SparseField } from '@/shared/types'
import { CohortHistogram } from './CohortHistogram'

vi.mock('@/shared/hooks', () => ({
  useResizeObserver: vi.fn().mockReturnValue({ width: 400, height: 200 }),
}))

const cohortData: CohortHistogramData[] = [
  {
    applied_month: 10,
    bins: [
      { cycle_week: 20, count: 15 },
      { cycle_week: 25, count: 30 },
    ],
    total: 45,
  },
  {
    applied_month: 11,
    bins: [
      { cycle_week: 22, count: 10 },
    ],
    total: 10,
  },
]

const nonSparseField: SparseField<CohortHistogramData[]> = {
  data: cohortData,
  sparse: false,
  reason: null,
}

const sparseField: SparseField<CohortHistogramData[]> = {
  data: null,
  sparse: true,
  reason: 'insufficient_observations',
}

describe('CohortHistogram', () => {
  it('renders role="alert" (SparsityWarning) when cohortHistograms.sparse is true', () => {
    render(
      <CohortHistogram
        cohortHistograms={sparseField}
        appliedMonth={null}
        currentCycleWeek={null}
        schoolName="Test Law"
      />
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders role="img" (histogram) when appliedMonth is set and matching cohort exists', () => {
    const { container } = render(
      <CohortHistogram
        cohortHistograms={nonSparseField}
        appliedMonth={10}
        currentCycleWeek={null}
        schoolName="Test Law"
      />
    )
    expect(container.querySelector('[role="img"]')).toBeInTheDocument()
  })

  it('renders role="alert" (SparsityWarning) when appliedMonth is set but no matching cohort', () => {
    render(
      <CohortHistogram
        cohortHistograms={nonSparseField}
        appliedMonth={99}
        currentCycleWeek={null}
        schoolName="Test Law"
      />
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders pooled view note text "Showing all applicants" when appliedMonth is null', () => {
    render(
      <CohortHistogram
        cohortHistograms={nonSparseField}
        appliedMonth={null}
        currentCycleWeek={null}
        schoolName="Test Law"
      />
    )
    expect(screen.getByText(/Showing all applicants/)).toBeInTheDocument()
  })
})
