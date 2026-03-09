import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SparsityWarning } from './SparsityWarning'

describe('SparsityWarning', () => {
  it('renders with role="alert"', () => {
    render(<SparsityWarning />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('has aria-live="polite"', () => {
    render(<SparsityWarning />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite')
  })

  it('maps "insufficient_observations" reason to human-readable message', () => {
    render(<SparsityWarning reason="insufficient_observations" />)
    expect(screen.getByText('Not enough data to display this chart')).toBeInTheDocument()
  })

  it('shows fallback "Insufficient data" when no reason provided', () => {
    render(<SparsityWarning />)
    expect(screen.getByText('Insufficient data')).toBeInTheDocument()
  })

  it('shows fallback "Insufficient data" when reason is null', () => {
    render(<SparsityWarning reason={null} />)
    expect(screen.getByText('Insufficient data')).toBeInTheDocument()
  })
})
