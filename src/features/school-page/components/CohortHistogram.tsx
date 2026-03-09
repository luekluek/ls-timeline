import { SparsityWarning } from '@/shared/components'
import type { CohortHistogramData, SparseField } from '@/shared/types'
import { HistogramChart } from '../charts/HistogramChart'

interface CohortHistogramProps {
  cohortHistograms: SparseField<CohortHistogramData[]>
  appliedMonth: number | null
  currentCycleWeek: number | null
  schoolName: string
}

export function CohortHistogram({
  cohortHistograms,
  appliedMonth,
  currentCycleWeek,
  schoolName,
}: CohortHistogramProps) {
  if (cohortHistograms.sparse) {
    return <SparsityWarning reason={cohortHistograms.reason} />
  }

  let chartData: CohortHistogramData
  let noteText: string | null = null

  if (appliedMonth !== null) {
    const cohort = cohortHistograms.data!.find(c => c.applied_month === appliedMonth)
    if (!cohort || cohort.total === 0) {
      return <SparsityWarning reason="insufficient_observations" />
    }
    chartData = cohort
  } else {
    // Pooled view: aggregate all cohorts
    const binMap = new Map<number, number>()
    for (const cohort of cohortHistograms.data!) {
      for (const bin of cohort.bins) {
        binMap.set(bin.cycle_week, (binMap.get(bin.cycle_week) ?? 0) + bin.count)
      }
    }
    const pooledBins = Array.from(binMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([cycle_week, count]) => ({ cycle_week, count }))
    const total = pooledBins.reduce((sum, b) => sum + b.count, 0)
    if (total === 0) {
      return <SparsityWarning reason="insufficient_observations" />
    }
    chartData = { applied_month: 0, bins: pooledBins, total }
    noteText = 'Showing all applicants — set an application month to see your cohort'
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-slate-400">Decision Timing</h2>
      {noteText && <p className="text-xs text-slate-500">{noteText}</p>}
      <HistogramChart data={chartData} currentCycleWeek={currentCycleWeek} schoolName={schoolName} />
    </div>
  )
}
