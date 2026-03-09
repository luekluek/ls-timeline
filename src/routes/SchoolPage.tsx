import { Link, useParams } from 'react-router-dom'
import {
  useSchoolData,
  CohortHistogram,
  PercentileBar,
  ExpectedDecisionLabel,
  DualKMPanel,
} from '@/features/school-page'
import { useWatchlist } from '@/features/watchlist'
import { StatCard, PhasePlaceholder } from '@/shared/components'
import { formatCycleWeek, computePercentile } from '@/shared/utils'

function StatCardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-lg p-4 flex flex-col gap-2 animate-pulse">
      <div className="h-8 w-16 bg-slate-700 rounded" />
      <div className="h-3 w-24 bg-slate-700 rounded" />
    </div>
  )
}

export default function SchoolPage() {
  const { id } = useParams<{ id: string }>()
  const { data, loading } = useSchoolData(id)
  const { watchlist } = useWatchlist()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    )
  }

  if (data === null) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-100">School not found</h1>
        <p className="text-slate-400 text-sm">No data available for &ldquo;{id}&rdquo;.</p>
      </div>
    )
  }

  // --- Stat card values ---
  const medianCard = data.median_decision_week.sparse
    ? { value: '—', label: 'insufficient data' }
    : { value: formatCycleWeek(data.median_decision_week.data!), label: 'Median decision (last cycle)' }

  const cycleWeekCard = data.current_cycle_week !== null
    ? { value: `Week ${data.current_cycle_week}`, label: 'Current cycle week' }
    : { value: '—', label: 'Current cycle week' }

  const entry = watchlist.find(e => e.school_id === id)
  const appliedMonth = entry?.applied_month ?? null

  let positionCard: { value: string; label: string }
  let cohortPercentile: number | null = null

  if (
    appliedMonth === null ||
    data.cohort_histograms.sparse ||
    data.current_cycle_week === null
  ) {
    positionCard = {
      value: '—',
      label: appliedMonth === null ? 'No application month set' : 'insufficient data',
    }
  } else {
    const cohort = data.cohort_histograms.data!.find(c => c.applied_month === appliedMonth)
    if (!cohort || cohort.total === 0) {
      positionCard = { value: '—', label: 'insufficient data' }
    } else {
      const decidedCount = cohort.bins
        .filter(b => b.cycle_week <= data.current_cycle_week!)
        .reduce((sum, b) => sum + b.count, 0)
      const pct = computePercentile(decidedCount, cohort.total)
      cohortPercentile = pct
      positionCard = { value: `${pct}%`, label: 'Of your cohort has decided' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Mobile back link — hidden on lg (sidebar covers navigation there) */}
      <Link
        to="/"
        className="lg:hidden flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
      >
        ← My Schools
      </Link>

      {/* School name */}
      <h1 className="text-xl font-semibold text-slate-100">{data.school_name}</h1>

      {/* Stat cards — render before any SVG chart */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard value={medianCard.value} label={medianCard.label} />
        <StatCard value={cycleWeekCard.value} label={cycleWeekCard.label} />
        <StatCard value={positionCard.value} label={positionCard.label} />
      </div>

      {/* Cohort histogram */}
      <CohortHistogram
        cohortHistograms={data.cohort_histograms}
        appliedMonth={appliedMonth}
        currentCycleWeek={data.current_cycle_week}
        schoolName={data.school_name}
      />

      {/* Percentile bar — only render when we have a valid percentile */}
      {cohortPercentile !== null && (
        <PercentileBar percentile={cohortPercentile} />
      )}

      {/* Expected decision label */}
      <ExpectedDecisionLabel medianDecisionWeek={data.median_decision_week} />

      {/* Dual Kaplan-Meier survival curves */}
      <DualKMPanel
        lastCycleKm={data.last_cycle_km}
        currentCycleKm={data.current_cycle_km}
        schoolName={data.school_name}
      />

      {/* Phase 2 placeholder — outcome predictions require profile (deferred) */}
      <PhasePlaceholder label="Enter your GPA and LSAT to see outcome predictions" />
    </div>
  )
}
