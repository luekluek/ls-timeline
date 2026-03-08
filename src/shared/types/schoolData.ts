export interface SparseField<T> {
  data: T | null
  sparse: boolean
  reason: string | null
}

export interface KmPoint {
  cycle_week: number
  survival: number
  in_progress?: boolean
}

export interface KmCurve {
  points: KmPoint[]
  cycle_year: number
}

export interface CohortHistogramBin {
  cycle_week: number
  count: number
}

export interface CohortHistogramData {
  applied_month: number
  bins: CohortHistogramBin[]
  total: number
}

export interface SchoolData {
  school_id: string
  school_name: string
  last_cycle_km: SparseField<KmCurve>
  current_cycle_km: SparseField<KmCurve>
  cohort_histograms: SparseField<CohortHistogramData[]>
  median_decision_week: SparseField<number>
  current_cycle_week: number | null
}
