import { useWatchlist, SchoolSearch, SchoolCard } from '../features/watchlist'
import { ProfileForm } from '../features/profile'
import schoolsIndexJson from '../data/schools-index.json'

const schoolsMap = new Map(
  (schoolsIndexJson as { school_id: string; school_name: string }[]).map(s => [s.school_id, s.school_name])
)

export default function HomePage() {
  const { watchlist, removeSchool } = useWatchlist()

  return (
    <div className="space-y-6 max-w-lg">
      {/* Profile section — always visible; skippable (no required gate) */}
      <section aria-label="Your profile">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Your Profile
        </h2>
        <ProfileForm />
      </section>

      {/* Mobile watchlist section — hidden on desktop (sidebar handles it) */}
      <section aria-label="Your schools" className="lg:hidden">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
          My Schools
        </h2>
        {watchlist.length === 0 ? (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">
              Add schools to your watchlist to see timing data
            </p>
            <SchoolSearch />
          </div>
        ) : (
          <div className="space-y-3">
            <ul className="space-y-1">
              {watchlist.map(entry => (
                <SchoolCard
                  key={entry.school_id}
                  school_id={entry.school_id}
                  school_name={schoolsMap.get(entry.school_id) ?? entry.school_id}
                  applied_month={entry.applied_month}
                  onRemove={removeSchool}
                />
              ))}
            </ul>
            <SchoolSearch />
          </div>
        )}
      </section>
    </div>
  )
}
