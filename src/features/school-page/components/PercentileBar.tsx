interface PercentileBarProps {
  percentile: number
}

export function PercentileBar({ percentile }: PercentileBarProps) {
  const clamped = Math.min(100, Math.max(0, percentile))

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-300">
        {clamped}% of your cohort has received decisions
      </p>
      <div
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`You are at the ${clamped}th percentile — ${clamped}% of your cohort have received decisions`}
        className="relative h-3 bg-slate-700 rounded-full overflow-visible"
      >
        <div
          className="absolute w-4 h-4 rounded-full bg-indigo-500"
          style={{ left: `${clamped}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
  )
}
