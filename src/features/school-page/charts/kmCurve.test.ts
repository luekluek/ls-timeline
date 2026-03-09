import { describe, it, expect } from 'vitest'
import * as d3 from 'd3'
import { buildKmScales, buildKmStepPath } from './kmCurve'

describe('buildKmScales', () => {
  it('handles empty points with fallback domain', () => {
    const { xScale, yScale } = buildKmScales([], 100, 100)
    expect(xScale.domain()).toEqual([0, 1])
    expect(yScale.domain()).toEqual([0, 1])
  })

  it('sets xScale domain to [0, maxCycleWeek]', () => {
    const points = [{ cycle_week: 5, survival: 0.8 }, { cycle_week: 10, survival: 0.4 }]
    const { xScale } = buildKmScales(points, 100, 100)
    expect(xScale.domain()).toEqual([0, 10])
    expect(xScale(10)).toBe(100)
    expect(xScale(0)).toBe(0)
  })

  it('sets yScale domain to [0, 1] inverted (survival: 1.0 → pixel 0 at top)', () => {
    const points = [{ cycle_week: 5, survival: 0.5 }]
    const { yScale } = buildKmScales(points, 100, 100)
    expect(yScale(1.0)).toBe(0)    // top of chart
    expect(yScale(0.0)).toBe(100)  // bottom of chart
  })
})

describe('buildKmStepPath', () => {
  it('returns empty string for empty points', () => {
    const xScale = d3.scaleLinear().domain([0, 10]).range([0, 100])
    const yScale = d3.scaleLinear().domain([0, 1]).range([100, 0])
    expect(buildKmStepPath([], xScale, yScale)).toBe('')
  })

  it('returns a non-empty string starting with M for valid points', () => {
    const xScale = d3.scaleLinear().domain([0, 10]).range([0, 100])
    const yScale = d3.scaleLinear().domain([0, 1]).range([100, 0])
    const points = [{ cycle_week: 0, survival: 1.0 }, { cycle_week: 5, survival: 0.5 }]
    const path = buildKmStepPath(points, xScale, yScale)
    expect(path).toBeTruthy()
    expect(path.startsWith('M')).toBe(true)
  })

  it('encodes step-function shape — start at (0,0), step to (50,50)', () => {
    // xScale: 0→0, 5→50, 10→100; yScale: 1.0→0, 0.5→50, 0→100
    const xScale = d3.scaleLinear().domain([0, 10]).range([0, 100])
    const yScale = d3.scaleLinear().domain([0, 1]).range([100, 0])
    const points = [{ cycle_week: 0, survival: 1.0 }, { cycle_week: 5, survival: 0.5 }]
    const path = buildKmStepPath(points, xScale, yScale)
    // Must start at (0, 0) — x=0→0, survival=1.0→0
    expect(path).toContain('0,0')
    // Must contain x=50 for cycle_week=5
    expect(path).toMatch(/[ML]?50/)
    // Must contain y=50 for survival=0.5
    expect(path).toMatch(/[VL]?50/)
  })
})
