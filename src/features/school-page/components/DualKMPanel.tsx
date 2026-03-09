import type { KmCurve, SparseField } from '@/shared/types'
import { KaplanMeierChart } from '../charts/KaplanMeierChart'

interface DualKMPanelProps {
  lastCycleKm: SparseField<KmCurve>
  currentCycleKm: SparseField<KmCurve>
  schoolName: string
}

export function DualKMPanel({ lastCycleKm, currentCycleKm, schoolName }: DualKMPanelProps) {
  // Compute shared X domain from all available points across both curves
  const lastPoints = lastCycleKm.sparse ? [] : (lastCycleKm.data?.points ?? [])
  const currentPoints = currentCycleKm.sparse ? [] : (currentCycleKm.data?.points ?? [])
  const allPoints = [...lastPoints, ...currentPoints]
  const sharedMaxWeek = allPoints.length > 0 ? Math.max(...allPoints.map(p => p.cycle_week)) : 40

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">Last cycle</p>
          <KaplanMeierChart
            points={lastPoints}
            isSparse={lastCycleKm.sparse}
            xDomainMax={sharedMaxWeek}
            schoolName={schoolName}
            label="Last cycle"
            strokeClass="stroke-slate-500"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">This cycle</p>
          <KaplanMeierChart
            points={currentPoints}
            isSparse={currentCycleKm.sparse}
            xDomainMax={sharedMaxWeek}
            schoolName={schoolName}
            label="This cycle"
            strokeClass="stroke-indigo-400"
          />
        </div>
      </div>
    </div>
  )
}
