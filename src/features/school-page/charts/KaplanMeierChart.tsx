import * as d3 from 'd3'
import { useRef } from 'react'
import { useResizeObserver } from '@/shared/hooks'
import type { KmPoint } from '@/shared/types'
import { buildKmStepPath, buildKmScales } from './kmCurve'
import { buildXTicks, buildYTicks } from './survivalAxis'

interface KaplanMeierChartProps {
  points: KmPoint[]
  isSparse?: boolean
  xDomainMax?: number
  schoolName: string
  label: string
  strokeClass?: string
}

const MARGIN = { top: 8, right: 8, bottom: 36, left: 40 }
const CHART_HEIGHT = 200
const INNER_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom // = 156

export function KaplanMeierChart({
  points,
  isSparse = false,
  xDomainMax,
  schoolName,
  label,
  strokeClass = 'stroke-slate-500',
}: KaplanMeierChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useResizeObserver(containerRef)

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right)

  // Separate event points from censored/in-progress points
  const solidPoints = points.filter(p => !p.in_progress)
  const hasInProgressTail = points.some(p => p.in_progress)

  // Build scales — use solidPoints for domain calculation (or fall back to all points)
  const basePoints = solidPoints.length > 0 ? solidPoints : points
  const { xScale, yScale } = buildKmScales(basePoints, innerWidth, INNER_HEIGHT)

  // Override X domain with shared max if provided (ensures identical X axis across DualKMPanel)
  if (xDomainMax !== undefined) {
    xScale.domain([0, xDomainMax])
  }

  const xTicks = buildXTicks(xScale, 6)
  const yTicks = buildYTicks(yScale, 5)

  const solidPath = buildKmStepPath(solidPoints, xScale, yScale)

  // Dashed extension: horizontal line at last solid survival value to right edge
  let dashedExt: { x1: number; x2: number; y: number } | null = null
  if (hasInProgressTail && solidPoints.length > 0) {
    const lastPt = solidPoints[solidPoints.length - 1]
    dashedExt = {
      x1: xScale(lastPt.cycle_week),
      x2: xScale.range()[1],
      y: yScale(lastPt.survival),
    }
  }

  return (
    <div ref={containerRef} className="w-full" style={{ height: `${CHART_HEIGHT}px` }}>
      {width > 0 && (
        <svg
          role="img"
          aria-label={`Survival curve for ${schoolName} — ${label}`}
          width={width}
          height={CHART_HEIGHT}
        >
          {isSparse ? (
            <text
              x={width / 2}
              y={CHART_HEIGHT / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-500"
              fontSize={14}
            >
              Not enough data
            </text>
          ) : (
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Solid KM step-function path */}
              {solidPath && (
                <path d={solidPath} fill="none" className={strokeClass} strokeWidth={1.5} />
              )}

              {/* Dashed in-progress extension */}
              {dashedExt && (
                <line
                  x1={dashedExt.x1}
                  x2={dashedExt.x2}
                  y1={dashedExt.y}
                  y2={dashedExt.y}
                  strokeDasharray="4 2"
                  className={strokeClass}
                  strokeWidth={1.5}
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
          )}
        </svg>
      )}
    </div>
  )
}
