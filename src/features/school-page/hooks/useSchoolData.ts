/// <reference types="vite/client" />
import { useState, useEffect } from 'react'
import type { SchoolData } from '@/shared/types'

// CRITICAL: Must be at module level (not inside the hook) so Vite can analyze at build time
// This produces one chunk per school JSON file — enables lazy loading (NFR1, NFR3)
const schoolModules = import.meta.glob('../../../data/schools/*.json', { eager: false })

export interface UseSchoolDataResult {
  data: SchoolData | null
  loading: boolean
  sparse: boolean
}

export function useSchoolData(schoolId: string | undefined): UseSchoolDataResult {
  const [data, setData] = useState<SchoolData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!schoolId) {
      setLoading(false)
      return
    }

    // Key must exactly match the glob pattern (relative path, not @-alias)
    const key = `../../../data/schools/${schoolId}.json`
    const loader = schoolModules[key]

    if (!loader) {
      // School ID not found in glob → not found state
      setData(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    loader()
      .then((mod: unknown) => {
        if (!cancelled) {
          setData((mod as { default: SchoolData }).default)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [schoolId])

  const sparse =
    data !== null &&
    data.cohort_histograms.sparse &&
    data.last_cycle_km.sparse &&
    data.current_cycle_km.sparse

  return { data, loading, sparse }
}
