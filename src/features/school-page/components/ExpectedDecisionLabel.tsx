import { formatCycleWeek } from '@/shared/utils'
import type { SparseField } from '@/shared/types'

interface ExpectedDecisionLabelProps {
  medianDecisionWeek: SparseField<number>
}

export function ExpectedDecisionLabel({ medianDecisionWeek }: ExpectedDecisionLabelProps) {
  if (medianDecisionWeek.sparse) {
    return <p className="text-sm text-slate-500">Insufficient data for expected decision week</p>
  }

  return (
    <p className="text-sm text-slate-300">
      Median decision week:{' '}
      <span className="font-medium text-indigo-400">
        {formatCycleWeek(medianDecisionWeek.data!)}
      </span>
      , based on last cycle
    </p>
  )
}
