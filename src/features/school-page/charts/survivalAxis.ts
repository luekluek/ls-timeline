// src/features/school-page/charts/survivalAxis.ts
import type { ScaleLinear } from 'd3'
import { formatCycleWeek } from '@/shared/utils'

export type TickItem = { value: number; label: string }

/**
 * Build X axis tick array for cycle_week axes (used by both KM and histogram charts).
 * Labels use formatCycleWeek: "Week 27 · Apr"
 */
export function buildXTicks(
  scale: ScaleLinear<number, number>,
  count: number
): TickItem[] {
  return scale.ticks(count).map(v => ({ value: v, label: formatCycleWeek(v) }))
}

/**
 * Build Y axis tick array — auto-detects scale type:
 * - Survival scale (domain max ≤ 1): formats as percentage "50%"
 * - Count scale (domain max > 1): formats as integer string "200"
 *
 * Assumption: count scales always have maxCount > 1 in real data (counts in hundreds).
 * Edge case: if maxCount === 1, domain()[1] === 1 and the scale is misidentified as
 * survival, producing "100%" instead of "1". Acceptable for this project's data range.
 */
export function buildYTicks(
  scale: ScaleLinear<number, number>,
  count: number
): TickItem[] {
  const isSurvivalScale = scale.domain()[1] <= 1
  return scale.ticks(count).map(v => ({
    value: v,
    label: isSurvivalScale ? `${Math.round(v * 100)}%` : String(Math.round(v)),
  }))
}
