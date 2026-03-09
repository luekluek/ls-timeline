import { useState, useEffect, useRef } from 'react'
import { useProfile } from './ProfileContext'

export function ProfileForm() {
  const { profile, setProfile } = useProfile()

  const [gpaInput, setGpaInput] = useState('')
  const [lsatInput, setLsatInput] = useState('')
  const [errors, setErrors] = useState<{ gpa?: string; lsat?: string }>({})
  const [saved, setSaved] = useState(false)
  // Tracks whether the current profile change was triggered by our own save,
  // so we don't reset the checkmark immediately after the user hits Save.
  const isSavingRef = useRef(false)

  useEffect(() => {
    if (profile !== null) {
      setGpaInput(profile.gpa.toString())
      setLsatInput(profile.lsat.toString())
      if (!isSavingRef.current) {
        setSaved(false)
      }
      isSavingRef.current = false
    }
  }, [profile])

  const validateGpa = (val: string): string | undefined => {
    const n = parseFloat(val)
    if (val === '' || isNaN(n) || n < 0 || n > 4.33)
      return 'GPA must be between 0.0 and 4.33'
  }

  const validateLsat = (val: string): string | undefined => {
    const n = parseInt(val, 10)
    if (val === '' || isNaN(n) || n < 120 || n > 180 || !Number.isInteger(parseFloat(val)))
      return 'LSAT must be between 120 and 180'
  }

  const handleSave = () => {
    const gpaErr = validateGpa(gpaInput)
    const lsatErr = validateLsat(lsatInput)
    setErrors({ gpa: gpaErr, lsat: lsatErr })
    if (gpaErr || lsatErr) return
    isSavingRef.current = true
    setProfile({ gpa: parseFloat(gpaInput), lsat: parseInt(lsatInput, 10) })
    setSaved(true)
  }

  const handleGpaChange = (v: string) => { setGpaInput(v); setSaved(false) }
  const handleLsatChange = (v: string) => { setLsatInput(v); setSaved(false) }

  return (
    <div className="rounded-lg bg-slate-800 p-4 space-y-4">
      <div className="space-y-1">
        <label htmlFor="gpa-input" className="text-sm text-indigo-400">GPA</label>
        <input
          id="gpa-input"
          type="number"
          min={0}
          max={4.33}
          step={0.01}
          value={gpaInput}
          onChange={(e) => handleGpaChange(e.target.value)}
          onBlur={() => setErrors((prev) => ({ ...prev, gpa: validateGpa(gpaInput) }))}
          className="w-full min-h-[44px] rounded bg-slate-700 px-3 text-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-describedby={errors.gpa ? 'gpa-error' : undefined}
        />
        {errors.gpa && (
          <span id="gpa-error" role="alert" className="text-sm text-red-400">{errors.gpa}</span>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="lsat-input" className="text-sm text-indigo-400">LSAT</label>
        <input
          id="lsat-input"
          type="number"
          min={120}
          max={180}
          step={1}
          value={lsatInput}
          onChange={(e) => handleLsatChange(e.target.value)}
          onBlur={() => setErrors((prev) => ({ ...prev, lsat: validateLsat(lsatInput) }))}
          className="w-full min-h-[44px] rounded bg-slate-700 px-3 text-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-describedby={errors.lsat ? 'lsat-error' : undefined}
        />
        {errors.lsat && (
          <span id="lsat-error" role="alert" className="text-sm text-red-400">{errors.lsat}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="min-h-[44px] px-4 rounded bg-indigo-600 text-white font-medium
                     hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-indigo-500"
        >
          Save profile
        </button>
        {saved && (
          <span aria-live="polite" className="text-indigo-400 text-sm">✓ Saved</span>
        )}
      </div>
    </div>
  )
}
