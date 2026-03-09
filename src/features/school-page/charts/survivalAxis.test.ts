import { describe, it, expect } from 'vitest'
import * as d3 from 'd3'
import { buildXTicks, buildYTicks } from './survivalAxis'

describe('buildXTicks', () => {
  it('returns array of TickItem with value and label', () => {
    const scale = d3.scaleLinear().domain([0, 40]).range([0, 400])
    const ticks = buildXTicks(scale, 5)
    expect(ticks.length).toBeGreaterThan(0)
    ticks.forEach(t => {
      expect(typeof t.value).toBe('number')
      expect(typeof t.label).toBe('string')
      expect(t.label.length).toBeGreaterThan(0)
    })
  })

  it('labels use formatCycleWeek format (contains "Week")', () => {
    const scale = d3.scaleLinear().domain([0, 40]).range([0, 400])
    const ticks = buildXTicks(scale, 5)
    ticks.forEach(t => expect(t.label).toMatch(/Week \d+/))
  })

  it('returns array with length <= count+1', () => {
    const scale = d3.scaleLinear().domain([0, 40]).range([0, 400])
    const ticks = buildXTicks(scale, 5)
    expect(ticks.length).toBeLessThanOrEqual(6)
  })
})

describe('buildYTicks', () => {
  it('formats survival scale (domain [0,1]) as percentages', () => {
    const scale = d3.scaleLinear().domain([0, 1]).range([100, 0])
    const ticks = buildYTicks(scale, 4)
    expect(ticks.some(t => t.label === '0%')).toBe(true)
    expect(ticks.some(t => t.label === '100%')).toBe(true)
    ticks.forEach(t => expect(t.label).toMatch(/\d+%/))
  })

  it('formats count scale (domain [0,400]) as numeric strings', () => {
    const scale = d3.scaleLinear().domain([0, 400]).range([100, 0])
    const ticks = buildYTicks(scale, 4)
    ticks.forEach(t => {
      expect(t.label).not.toContain('%')
      expect(isNaN(Number(t.label))).toBe(false)
    })
  })

  it('all items have value (number) and label (string)', () => {
    const scale = d3.scaleLinear().domain([0, 1]).range([100, 0])
    const ticks = buildYTicks(scale, 4)
    ticks.forEach(t => {
      expect(typeof t.value).toBe('number')
      expect(typeof t.label).toBe('string')
    })
  })
})
