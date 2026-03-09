import { useRef } from 'react'
import { useResizeObserver } from '@/shared/hooks'
import type { CohortHistogramData } from '@/shared/types'
import { buildHistogramScales } from './histogramBins'
import { buildXTicks, buildYTicks } from './survivalAxis'

interface HistogramChartProps {
  data: CohortHistogramData
  currentCycleWeek: number | null
  schoolName: string
}

const MARGIN = { top: 8, right: 8, bottom: 36, left: 40 }
const CHART_HEIGHT = 200
const INNER_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom // = 156

export function HistogramChart({ data, currentCycleWeek, schoolName }: HistogramChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useResizeObserver(containerRef)

  if (width === 0) {
    return <div ref={containerRef} className="w-full" style={{ height: `${CHART_HEIGHT}px` }} />
  }

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right)
  const { xScale, yScale, bins } = buildHistogramScales(data, innerWidth, INNER_HEIGHT)
  const xTicks = buildXTicks(xScale, 6)
  const yTicks = buildYTicks(yScale, 4)
  const barWidth = Math.max(2, (xScale(1) - xScale(0)) * 0.8)

  return (
    <div ref={containerRef} className="w-full" style={{ height: `${CHART_HEIGHT}px` }}>
      <svg
          role="img"
          aria-label={`Decision timing histogram for ${schoolName}`}
          width={width}
          height={CHART_HEIGHT}
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* Bars */}
            {bins.map(bin => (
              <rect
                key={bin.cycle_week}
                x={xScale(bin.cycle_week) - barWidth / 2}
                y={yScale(bin.count)}
                width={barWidth}
                height={Math.max(0, INNER_HEIGHT - yScale(bin.count))}
                className="fill-indigo-400/70"
              />
            ))}

            {/* Today marker */}
            {currentCycleWeek !== null && (
              <line
                x1={xScale(currentCycleWeek)}
                x2={xScale(currentCycleWeek)}
                y1={0}
                y2={INNER_HEIGHT}
                strokeDasharray="4 2"
                className="stroke-amber-400 stroke-1"
              />
            )}

            {/* X axis */}
            <g transform={`translate(0,${INNER_HEIGHT})`}>
              <line x2={innerWidth} className="stroke-slate-700" />
              {xTicks.map(tick => (
                <g key={tick.value} transform={`translate(${xScale(tick.value)},0)`}>
                  <line y2={4} className="stroke-slate-600" />
                  <text
                    y={8}
                    dy="0.7em"
                    textAnchor="middle"
                    fontSize={9}
                    className="fill-slate-500"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}
            </g>

            {/* Y axis */}
            <g>
              <line y2={INNER_HEIGHT} className="stroke-slate-700" />
              {yTicks.map(tick => (
                <g key={tick.value} transform={`translate(0,${yScale(tick.value)})`}>
                  <line x2={-4} className="stroke-slate-600" />
                  <text
                    x={-8}
                    dy="0.3em"
                    textAnchor="end"
                    fontSize={9}
                    className="fill-slate-500"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}
            </g>
          </g>
        </svg>
    </div>
  )
}
