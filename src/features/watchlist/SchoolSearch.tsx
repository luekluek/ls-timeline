import { useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { useWatchlist } from './WatchlistContext'
import schoolsIndexJson from '../../data/schools-index.json'

const schools = schoolsIndexJson as { school_id: string; school_name: string }[]

type Step = 'search' | 'month'

export function SchoolSearch() {
  const { watchlist, addSchool } = useWatchlist()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [step, setStep] = useState<Step>('search')
  const [pendingSchool, setPendingSchool] = useState<{
    school_id: string
    school_name: string
  } | null>(null)
  const [monthInput, setMonthInput] = useState('')
  const [monthError, setMonthError] = useState('')

  const isInWatchlist = (school_id: string) =>
    watchlist.some(e => e.school_id === school_id)

  function handleSelectSchool(school: {
    school_id: string
    school_name: string
  }) {
    if (isInWatchlist(school.school_id)) return
    setPendingSchool(school)
    setStep('month')
    setMonthInput('')
    setMonthError('')
  }

  function handleAddWithMonth() {
    if (!pendingSchool) return
    if (monthInput !== '') {
      const month = parseInt(monthInput, 10)
      if (isNaN(month) || month < 1 || month > 12) {
        setMonthError('Month must be 1–12')
        return
      }
      addSchool({ school_id: pendingSchool.school_id, applied_month: month })
    } else {
      addSchool({ school_id: pendingSchool.school_id, applied_month: null })
    }
    resetAndClose()
  }

  function handleSkipMonth() {
    if (!pendingSchool) return
    addSchool({ school_id: pendingSchool.school_id, applied_month: null })
    resetAndClose()
  }

  function resetAndClose() {
    setOpen(false)
    setStep('search')
    setPendingSchool(null)
    setMonthInput('')
    setMonthError('')
    setQuery('')
  }

  const filteredSchools = schools.filter(s =>
    s.school_name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="min-h-[44px] px-4 py-2 bg-slate-800 text-slate-200 rounded-md hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Add school to watchlist"
        >
          Add school +
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 bg-slate-800 border-slate-700">
        {step === 'search' && (
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search schools…"
              className="border-0 focus:ring-0"
            />
            <CommandList>
              <CommandEmpty className="text-slate-500 py-4 text-center text-sm">
                {query
                  ? `No schools match '${query}'`
                  : 'Type to search schools'}
              </CommandEmpty>
              <CommandGroup>
                {filteredSchools.map(school => {
                  const inList = isInWatchlist(school.school_id)
                  return (
                    <CommandItem
                      key={school.school_id}
                      value={school.school_name}
                      onSelect={() => handleSelectSchool(school)}
                      disabled={inList}
                      className={inList ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      <span className="flex-1">{school.school_name}</span>
                      {inList && (
                        <span
                          className="text-indigo-400"
                          aria-label="Already in watchlist"
                        >
                          ✓
                        </span>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}

        {step === 'month' && pendingSchool && (
          <div className="p-4 space-y-3">
            <p className="text-sm text-slate-300 font-medium">
              {pendingSchool.school_name}
            </p>
            <label
              className="block text-xs text-slate-400"
              htmlFor="month-input"
            >
              Applied month (optional, 1–12)
            </label>
            <input
              id="month-input"
              type="number"
              min={1}
              max={12}
              value={monthInput}
              onChange={e => {
                setMonthInput(e.target.value)
                setMonthError('')
              }}
              placeholder="e.g. 10 for October"
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[44px]"
              autoFocus
            />
            {monthError && (
              <p className="text-xs text-red-400">{monthError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAddWithMonth}
                className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Add
              </button>
              <button
                onClick={handleSkipMonth}
                className="flex-1 min-h-[44px] bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
