// src/features/school-page/charts/histogramBins.ts
import * as d3 from 'd3'
import type { CohortHistogramBin, CohortHistogramData } from '@/shared/types'

export type HistogramScales = {
  xScale: d3.ScaleLinear<number, number>
  yScale: d3.ScaleLinear<number, number>
  bins: CohortHistogramBin[]
}

/**
 * Build D3 linear scales and bin array for a cohort histogram chart.
 * Input: a single cohort's histogram data (already filtered to one applied_month).
 * xScale: cycle_week → pixel x (domain [0, maxWeek], range [0, width])
 * yScale: count      → pixel y (domain [0, maxCount], range [height, 0]) — inverted for SVG
 * bins: pass-through of data.bins for JSX rendering
 */
export function buildHistogramScales(
  data: CohortHistogramData,
  width: number,
  height: number
): HistogramScales {
  const bins = data.bins
  const maxWeek = bins.length > 0 ? Math.max(...bins.map(b => b.cycle_week)) : 1
  const maxCount = bins.length > 0 ? Math.max(...bins.map(b => b.count)) : 1

  const xScale = d3.scaleLinear().domain([0, maxWeek]).range([0, width])
  const yScale = d3.scaleLinear().domain([0, maxCount]).range([height, 0])

  return { xScale, yScale, bins }
}
