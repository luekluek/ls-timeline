import { describe, it, expect } from 'vitest'
import { buildHistogramScales } from './histogramBins'
import type { CohortHistogramData } from '@/shared/types'

const fixture: CohortHistogramData = {
  applied_month: 10,
  bins: [{ cycle_week: 20, count: 100 }, { cycle_week: 25, count: 200 }],
  total: 300,
}

describe('buildHistogramScales', () => {
  it('returns bins unchanged from input', () => {
    const { bins } = buildHistogramScales(fixture, 100, 100)
    expect(bins).toEqual(fixture.bins)
  })

  it('maps maxWeek to full width', () => {
    const { xScale } = buildHistogramScales(fixture, 200, 100)
    expect(xScale(25)).toBe(200)
    expect(xScale(0)).toBe(0)
  })

  it('yScale maps maxCount to 0 (SVG top) and 0 to height', () => {
    const { yScale } = buildHistogramScales(fixture, 100, 150)
    expect(yScale(200)).toBe(0)    // max count → top of chart
    expect(yScale(0)).toBe(150)    // 0 count → bottom of chart
  })

  it('handles empty bins with fallback domain [0,1]', () => {
    const emptyData: CohortHistogramData = { applied_month: 10, bins: [], total: 0 }
    const { xScale, yScale } = buildHistogramScales(emptyData, 100, 100)
    expect(xScale.domain()).toEqual([0, 1])
    expect(yScale.domain()).toEqual([0, 1])
  })
})
