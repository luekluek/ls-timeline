import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from './StatCard'

describe('StatCard', () => {
  it('renders value and label', () => {
    render(<StatCard value="Week 27 · Apr" label="Median decision (last cycle)" />)
    expect(screen.getByText('Week 27 · Apr')).toBeInTheDocument()
    expect(screen.getByText('Median decision (last cycle)')).toBeInTheDocument()
  })

  it('value has text-indigo-400 class, label has text-slate-500 class', () => {
    render(<StatCard value="60%" label="Of your cohort has decided" />)
    const value = screen.getByText('60%')
    const label = screen.getByText('Of your cohort has decided')
    expect(value.className).toContain('text-indigo-400')
    expect(label.className).toContain('text-slate-500')
  })
})
