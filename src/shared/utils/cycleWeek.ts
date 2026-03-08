// Month boundaries: [startWeek, monthLabel]
// Based on the law school application cycle starting in September.
// Note: January spans only week 17 due to calendar alignment at cycle start.
const MONTH_BOUNDARIES: Array<[number, string]> = [
  [1, 'Sep'],
  [5, 'Oct'],
  [9, 'Nov'],
  [13, 'Dec'],
  [17, 'Jan'],
  [18, 'Feb'],
  [22, 'Mar'],
  [26, 'Apr'],
  [30, 'May'],
  [34, 'Jun'],
]

export function formatCycleWeek(week: number): string {
  let label = MONTH_BOUNDARIES[0][1]
  for (const [start, month] of MONTH_BOUNDARIES) {
    if (week >= start) label = month
    else break
  }
  return `Week ${week} \u00B7 ${label}`
}
