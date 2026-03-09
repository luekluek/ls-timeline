import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PercentileBar } from './PercentileBar'

describe('PercentileBar', () => {
  it('renders element with role="meter"', () => {
    render(<PercentileBar percentile={58} />)
    expect(screen.getByRole('meter')).toBeInTheDocument()
  })

  it('aria-valuenow equals input percentile', () => {
    render(<PercentileBar percentile={58} />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '58')
  })

  it('aria-valuemin is 0 and aria-valuemax is 100', () => {
    render(<PercentileBar percentile={58} />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuemin', '0')
    expect(meter).toHaveAttribute('aria-valuemax', '100')
  })

  it('marker style.left is "75%" for percentile=75', () => {
    const { container } = render(<PercentileBar percentile={75} />)
    const marker = container.querySelector('[style*="left"]')
    expect(marker?.getAttribute('style')).toContain('75%')
  })
})
