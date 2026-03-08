interface PhasePlaceholderProps {
  label: string
}

export default function PhasePlaceholder({ label }: PhasePlaceholderProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded p-4">
      <p className="text-slate-500 text-sm">{label}</p>
    </div>
  )
}
