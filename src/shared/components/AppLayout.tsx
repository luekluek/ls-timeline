import { Outlet } from 'react-router-dom'
import DataFreshnessTag from './DataFreshnessTag'
import { useWatchlist, SchoolSearch, SchoolCard } from '@/features/watchlist'
import { schoolsMap } from '../utils/schoolsMap'

export default function AppLayout() {
  const { watchlist, removeSchool } = useWatchlist()

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-indigo-400">ls_timeline</span>
        <DataFreshnessTag />
      </header>

      {/* Persistent data caveat banner — FR36 */}
      <div role="note" aria-label="Data caveat" className="bg-slate-800 border-b border-slate-700 px-4 py-2 text-xs text-amber-500">
        ⚠️ Data is self-reported by applicants and community-sourced. Treat all statistics as estimates only.
      </div>

      <div className="flex flex-1">
        {/* Sidebar: 220px fixed, desktop only (lg:) */}
        <aside
          className="hidden lg:block w-[220px] shrink-0 border-r border-slate-800 bg-slate-900"
          aria-label="School watchlist"
        >
          <div className="flex flex-col h-full p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                My Schools
              </span>
              <SchoolSearch />
            </div>
            {watchlist.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Add schools to track timing
              </p>
            ) : (
              <nav aria-label="Watchlist schools">
                <ul className="space-y-0.5">
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
              </nav>
            )}
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
