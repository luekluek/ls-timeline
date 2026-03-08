import { formatCycleWeek } from './cycleWeek'

describe('formatCycleWeek', () => {
  it('week 1 → Sep', () => {
    expect(formatCycleWeek(1)).toBe('Week 1 \u00B7 Sep')
  })

  it('week 18 → Feb (AC verification)', () => {
    expect(formatCycleWeek(18)).toBe('Week 18 \u00B7 Feb')
  })

  it('week 13 → Dec', () => {
    expect(formatCycleWeek(13)).toBe('Week 13 \u00B7 Dec')
  })

  it('week 17 → Jan', () => {
    expect(formatCycleWeek(17)).toBe('Week 17 \u00B7 Jan')
  })

  it('week 37 → Jun', () => {
    expect(formatCycleWeek(37)).toBe('Week 37 \u00B7 Jun')
  })
})
