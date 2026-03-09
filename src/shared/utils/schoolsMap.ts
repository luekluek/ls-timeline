import schoolsIndexJson from '@/data/schools-index.json'

export const schoolsMap = new Map(
  (schoolsIndexJson as { school_id: string; school_name: string }[]).map(s => [s.school_id, s.school_name])
)
