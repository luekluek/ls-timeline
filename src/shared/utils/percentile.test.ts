import { computePercentile } from './percentile'

describe('computePercentile', () => {
  it('first in cohort', () => {
    expect(computePercentile(1, 100)).toBe(1)
  })

  it('last in cohort', () => {
    expect(computePercentile(100, 100)).toBe(100)
  })

  it('midpoint', () => {
    expect(computePercentile(50, 100)).toBe(50)
  })

  it('empty cohort returns 0', () => {
    expect(computePercentile(0, 0)).toBe(0)
  })

  it('3 of 10 → 30', () => {
    expect(computePercentile(3, 10)).toBe(30)
  })

  it('position exceeds total → clamped to 100', () => {
    expect(computePercentile(105, 100)).toBe(100)
  })
})
