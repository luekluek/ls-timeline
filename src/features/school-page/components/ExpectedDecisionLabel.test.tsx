import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { SparseField } from '@/shared/types'
import { ExpectedDecisionLabel } from './ExpectedDecisionLabel'

describe('ExpectedDecisionLabel', () => {
  it('renders "Insufficient data" text when sparse', () => {
    const sparse: SparseField<number> = { data: null, sparse: true, reason: null }
    render(<ExpectedDecisionLabel medianDecisionWeek={sparse} />)
    expect(screen.getByText(/Insufficient data for expected decision week/)).toBeInTheDocument()
  })

  it('renders text containing "Week 22" for non-sparse input with data: 22', () => {
    const nonSparse: SparseField<number> = { data: 22, sparse: false, reason: null }
    render(<ExpectedDecisionLabel medianDecisionWeek={nonSparse} />)
    expect(screen.getByText(/Week 22/)).toBeInTheDocument()
  })
})
