const REASON_MESSAGES: Record<string, string> = {
  insufficient_observations: 'Not enough data to display this chart',
  single_cycle_only: 'Only one cycle of data available',
}

interface SparsityWarningProps {
  reason?: string | null
}

export function SparsityWarning({ reason }: SparsityWarningProps) {
  const message = (reason && REASON_MESSAGES[reason]) ?? 'Insufficient data'
  return (
    <div role="alert" aria-live="polite" className="flex items-center gap-2 text-amber-600">
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      <span className="text-sm">{message}</span>
    </div>
  )
}
