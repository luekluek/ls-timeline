import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { KmPoint } from '@/shared/types'
import { useResizeObserver } from '@/shared/hooks'
import { KaplanMeierChart } from './KaplanMeierChart'

vi.mock('@/shared/hooks', () => ({
  useResizeObserver: vi.fn().mockReturnValue({ width: 400, height: 200 }),
}))

// All-event fixture (no in-progress)
const solidFixture: KmPoint[] = [
  { cycle_week: 10, survival: 1.0 },
  { cycle_week: 15, survival: 0.9 },
  { cycle_week: 20, survival: 0.75 },
  { cycle_week: 25, survival: 0.6 },
  { cycle_week: 30, survival: 0.4 },
]

// In-progress fixture (last two points are censored)
const inProgressFixture: KmPoint[] = [
  { cycle_week: 10, survival: 1.0 },
  { cycle_week: 15, survival: 0.9 },
  { cycle_week: 20, survival: 0.75 },
  { cycle_week: 25, survival: 0.75, in_progress: true },
  { cycle_week: 28, survival: 0.75, in_progress: true },
]

// All-in-progress fixture (no solid event points — survival never dropped from 1.0)
const allInProgressFixture: KmPoint[] = [
  { cycle_week: 5, survival: 1.0, in_progress: true },
  { cycle_week: 10, survival: 1.0, in_progress: true },
]

describe('KaplanMeierChart', () => {
  it('renders element with role="img"', () => {
    const { container } = render(
      <KaplanMeierChart points={solidFixture} schoolName="Test Law" label="Last cycle" />
    )
    expect(container.querySelector('[role="img"]')).toBeInTheDocument()
  })

  it('aria-label contains school name and cycle label', () => {
    const { container } = render(
      <KaplanMeierChart points={solidFixture} schoolName="Test Law" label="Last cycle" />
    )
    const svg = container.querySelector('[role="img"]')
    expect(svg?.getAttribute('aria-label')).toContain('Test Law')
    expect(svg?.getAttribute('aria-label')).toContain('Last cycle')
  })

  it('non-sparse with points renders a <path> element', () => {
    const { container } = render(
      <KaplanMeierChart points={solidFixture} schoolName="Test Law" label="Last cycle" />
    )
    const path = container.querySelector('path')
    expect(path).toBeInTheDocument()
  })

  it('points with in_progress: true renders a dashed <line> element', () => {
    const { container } = render(
      <KaplanMeierChart points={inProgressFixture} schoolName="Test Law" label="This cycle" />
    )
    expect(container.querySelector('[stroke-dasharray]')).toBeInTheDocument()
  })

  it('all points non-in-progress → no dashed line rendered', () => {
    const { container } = render(
      <KaplanMeierChart points={solidFixture} schoolName="Test Law" label="Last cycle" />
    )
    expect(container.querySelector('[stroke-dasharray]')).not.toBeInTheDocument()
  })

  it('all points in_progress (no solid events) → renders dashed line at survival=1.0', () => {
    const { container } = render(
      <KaplanMeierChart points={allInProgressFixture} schoolName="Test Law" label="This cycle" />
    )
    expect(container.querySelector('[stroke-dasharray]')).toBeInTheDocument()
    expect(container.querySelector('path')).not.toBeInTheDocument()
  })

  it('isSparse=true renders "Not enough data" text, no <path> element', () => {
    const { getByText, container } = render(
      <KaplanMeierChart points={[]} isSparse schoolName="Test Law" label="Last cycle" />
    )
    expect(getByText('Not enough data')).toBeInTheDocument()
    expect(container.querySelector('path')).not.toBeInTheDocument()
  })

  it('isSparse=true still renders role="img" element', () => {
    const { container } = render(
      <KaplanMeierChart points={[]} isSparse schoolName="Test Law" label="Last cycle" />
    )
    expect(container.querySelector('[role="img"]')).toBeInTheDocument()
  })

  it('width=0 (initial paint) renders container div but no SVG', () => {
    vi.mocked(useResizeObserver).mockReturnValueOnce({ width: 0, height: 0 })
    const { container } = render(
      <KaplanMeierChart points={solidFixture} schoolName="Test Law" label="Last cycle" />
    )
    expect(container.querySelector('svg')).not.toBeInTheDocument()
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('xDomainMax prop renders chart without error', () => {
    const { container } = render(
      <KaplanMeierChart
        points={solidFixture}
        xDomainMax={52}
        schoolName="Test Law"
        label="Last cycle"
      />
    )
    expect(container.querySelector('[role="img"]')).toBeInTheDocument()
    expect(container.querySelector('path')).toBeInTheDocument()
  })
})
