import { Outlet } from 'react-router-dom'
import DataFreshnessTag from './DataFreshnessTag'

export default function AppLayout() {
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
          {/* Watchlist content added in Story 3.5 */}
        </aside>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
