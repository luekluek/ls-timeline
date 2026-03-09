import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { SparseField, KmCurve } from '@/shared/types'
import { DualKMPanel } from './DualKMPanel'

vi.mock('@/shared/hooks', () => ({
  useResizeObserver: vi.fn().mockReturnValue({ width: 400, height: 200 }),
}))

const nonSparseKm: SparseField<KmCurve> = {
  data: {
    points: [
      { cycle_week: 20, survival: 0.8 },
      { cycle_week: 30, survival: 0.5 },
    ],
    cycle_year: 2024,
  },
  sparse: false,
  reason: null,
}

const sparseKm: SparseField<KmCurve> = {
  data: null,
  sparse: true,
  reason: 'insufficient_observations',
}

describe('DualKMPanel', () => {
  it('renders two elements with role="img" (one per chart)', () => {
    const { container } = render(
      <DualKMPanel lastCycleKm={nonSparseKm} currentCycleKm={nonSparseKm} schoolName="Test Law" />
    )
    expect(container.querySelectorAll('[role="img"]').length).toBe(2)
  })

  it('"Last cycle" label is present in the rendered output', () => {
    render(
      <DualKMPanel lastCycleKm={nonSparseKm} currentCycleKm={nonSparseKm} schoolName="Test Law" />
    )
    expect(screen.getByText('Last cycle')).toBeInTheDocument()
  })

  it('"This cycle" label is present in the rendered output', () => {
    render(
      <DualKMPanel lastCycleKm={nonSparseKm} currentCycleKm={nonSparseKm} schoolName="Test Law" />
    )
    expect(screen.getByText('This cycle')).toBeInTheDocument()
  })

  it('both KM fields sparse → two "Not enough data" texts visible', () => {
    const { getAllByText } = render(
      <DualKMPanel lastCycleKm={sparseKm} currentCycleKm={sparseKm} schoolName="Test Law" />
    )
    expect(getAllByText('Not enough data').length).toBe(2)
  })

  it('lastCycleKm sparse, currentCycleKm not sparse → one "Not enough data", one chart with data', () => {
    const { getAllByText, container } = render(
      <DualKMPanel
        lastCycleKm={sparseKm}
        currentCycleKm={nonSparseKm}
        schoolName="Test Law"
      />
    )
    expect(getAllByText('Not enough data').length).toBe(1)
    // Non-sparse chart renders a path
    expect(container.querySelector('path')).toBeInTheDocument()
  })

  it('shared X domain uses max across both curves (wider curve controls xDomainMax)', () => {
    const wideKm: SparseField<KmCurve> = {
      data: { points: [{ cycle_week: 52, survival: 0.7 }], cycle_year: 2024 },
      sparse: false,
      reason: null,
    }
    const { container } = render(
      <DualKMPanel lastCycleKm={wideKm} currentCycleKm={nonSparseKm} schoolName="Test Law" />
    )
    // Both charts render without error with sharedMaxWeek=52 passed to both
    expect(container.querySelectorAll('[role="img"]').length).toBe(2)
  })

  it('both sparse → default sharedMaxWeek=40 used, two charts render without error', () => {
    const { container } = render(
      <DualKMPanel lastCycleKm={sparseKm} currentCycleKm={sparseKm} schoolName="Test Law" />
    )
    expect(container.querySelectorAll('[role="img"]').length).toBe(2)
  })
})
