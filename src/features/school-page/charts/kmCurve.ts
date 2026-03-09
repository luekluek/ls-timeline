// src/features/school-page/charts/kmCurve.ts
import * as d3 from 'd3'
import type { KmPoint } from '@/shared/types'

export type KmScales = {
  xScale: d3.ScaleLinear<number, number>
  yScale: d3.ScaleLinear<number, number>
}

/**
 * Build D3 linear scales for a KM survival chart.
 * xScale: cycle_week → pixel x (domain [0, maxWeek], range [0, width])
 * yScale: survival   → pixel y (domain [0, 1], range [height, 0]) — inverted for SVG
 */
export function buildKmScales(
  points: KmPoint[],
  width: number,
  height: number
): KmScales {
  const maxWeek = points.length > 0 ? Math.max(...points.map(p => p.cycle_week)) : 1
  const xScale = d3.scaleLinear().domain([0, maxWeek]).range([0, width])
  const yScale = d3.scaleLinear().domain([0, 1]).range([height, 0])
  return { xScale, yScale }
}

/**
 * Build an SVG path `d` string for a KM step-function curve.
 * Uses D3 curveStepAfter: horizontal segment first, then vertical drop at each event time.
 * Returns '' for empty points array.
 */
export function buildKmStepPath(
  points: KmPoint[],
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>
): string {
  const lineGenerator = d3
    .line<KmPoint>()
    .x(d => xScale(d.cycle_week))
    .y(d => yScale(d.survival))
    .curve(d3.curveStepAfter)
  return lineGenerator(points) ?? ''
}
