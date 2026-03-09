interface StatCardProps {
  value: string
  label: string
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 flex flex-col gap-1">
      <span className="text-2xl font-bold text-indigo-400">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}
