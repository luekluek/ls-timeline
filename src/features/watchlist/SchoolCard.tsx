import { Link } from 'react-router-dom'

interface SchoolCardProps {
  school_id: string
  school_name: string
  applied_month: number | null
  onRemove: (school_id: string) => void
}

export function SchoolCard({ school_id, school_name, applied_month, onRemove }: SchoolCardProps) {
  return (
    <li className="flex items-center gap-1 rounded-md hover:bg-slate-800">
      <Link
        to={`/school/${school_id}`}
        className="flex-1 flex items-center gap-2 min-h-[44px] px-3 text-sm text-slate-200
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
      >
        <span>{school_name}</span>
        {applied_month !== null && (
          <span className="text-xs bg-slate-700 text-slate-400 rounded px-1.5 py-0.5 shrink-0">
            Month {applied_month}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => onRemove(school_id)}
        aria-label={`Remove ${school_name}`}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center
                   text-slate-500 hover:text-red-400
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
      >
        ✕
      </button>
    </li>
  )
}
