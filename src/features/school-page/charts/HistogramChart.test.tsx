import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { CohortHistogramData } from '@/shared/types'
import { HistogramChart } from './HistogramChart'

vi.mock('@/shared/hooks', () => ({
  useResizeObserver: vi.fn().mockReturnValue({ width: 400, height: 200 }),
}))

const fixture: CohortHistogramData = {
  applied_month: 10,
  bins: [
    { cycle_week: 20, count: 15 },
    { cycle_week: 25, count: 30 },
    { cycle_week: 30, count: 10 },
  ],
  total: 55,
}

describe('HistogramChart', () => {
  it('renders element with role="img"', () => {
    const { container } = render(
      <HistogramChart data={fixture} currentCycleWeek={25} schoolName="Test Law" />
    )
    expect(container.querySelector('[role="img"]')).toBeInTheDocument()
  })

  it('aria-label contains school name', () => {
    const { container } = render(
      <HistogramChart data={fixture} currentCycleWeek={25} schoolName="Harvard Law" />
    )
    const svg = container.querySelector('[role="img"]')
    expect(svg?.getAttribute('aria-label')).toContain('Harvard Law')
  })

  it('renders correct number of rect elements (one per bin)', () => {
    const { container } = render(
      <HistogramChart data={fixture} currentCycleWeek={null} schoolName="Test Law" />
    )
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBe(fixture.bins.length)
  })

  it('renders a line element when currentCycleWeek is not null', () => {
    const { container } = render(
      <HistogramChart data={fixture} currentCycleWeek={25} schoolName="Test Law" />
    )
    const lines = container.querySelectorAll('line')
    expect(lines.length).toBeGreaterThan(0)
  })

  it('does not render today marker line when currentCycleWeek is null', () => {
    const { container } = render(
      <HistogramChart data={fixture} currentCycleWeek={null} schoolName="Test Law" />
    )
    // No strokeDasharray line (the today marker)
    const lines = Array.from(container.querySelectorAll('line'))
    const todayMarker = lines.find(l => l.getAttribute('stroke-dasharray') === '4 2')
    expect(todayMarker).toBeUndefined()
  })
})
