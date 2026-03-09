// src/features/school-page/charts/survivalAxis.ts
import * as d3 from 'd3'
import { formatCycleWeek } from '@/shared/utils'

export type TickItem = { value: number; label: string }

/**
 * Build X axis tick array for cycle_week axes (used by both KM and histogram charts).
 * Labels use formatCycleWeek: "Week 27 · Apr"
 */
export function buildXTicks(
  scale: d3.ScaleLinear<number, number>,
  count: number
): TickItem[] {
  return scale.ticks(count).map(v => ({ value: v, label: formatCycleWeek(v) }))
}

/**
 * Build Y axis tick array — auto-detects scale type:
 * - Survival scale (domain max ≤ 1): formats as percentage "50%"
 * - Count scale (domain max > 1): formats as integer string "200"
 */
export function buildYTicks(
  scale: d3.ScaleLinear<number, number>,
  count: number
): TickItem[] {
  const isSurvivalScale = scale.domain()[1] <= 1
  return scale.ticks(count).map(v => ({
    value: v,
    label: isSurvivalScale ? `${Math.round(v * 100)}%` : String(Math.round(v)),
  }))
}
