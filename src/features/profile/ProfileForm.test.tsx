import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileProvider } from './ProfileContext'
import { ProfileForm } from './ProfileForm'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProfileProvider>{children}</ProfileProvider>
)

beforeEach(() => {
  localStorage.clear()
})

describe('ProfileForm', () => {
  it('shows empty inputs when profile is null', () => {
    render(<ProfileForm />, { wrapper })
    expect((screen.getByLabelText('GPA') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('LSAT') as HTMLInputElement).value).toBe('')
  })

  it('pre-populates GPA and LSAT when profile exists in localStorage', () => {
    localStorage.setItem('lst.profile', JSON.stringify({ gpa: 3.8, lsat: 172 }))
    render(<ProfileForm />, { wrapper })
    expect((screen.getByLabelText('GPA') as HTMLInputElement).value).toBe('3.8')
    expect((screen.getByLabelText('LSAT') as HTMLInputElement).value).toBe('172')
  })

  it('shows GPA error on blur with value above 4.33', async () => {
    render(<ProfileForm />, { wrapper })
    const gpaInput = screen.getByLabelText('GPA')
    await userEvent.type(gpaInput, '5.5')
    fireEvent.blur(gpaInput)
    expect(screen.getByRole('alert')).toHaveTextContent('GPA must be between 0.0 and 4.33')
  })

  it('shows LSAT error on blur with value above 180', async () => {
    render(<ProfileForm />, { wrapper })
    const lsatInput = screen.getByLabelText('LSAT')
    await userEvent.type(lsatInput, '190')
    fireEvent.blur(lsatInput)
    expect(screen.getByRole('alert')).toHaveTextContent('LSAT must be between 120 and 180')
  })

  it('does not save partial profile when only GPA is entered', async () => {
    render(<ProfileForm />, { wrapper })
    await userEvent.type(screen.getByLabelText('GPA'), '3.8')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(localStorage.getItem('lst.profile')).toBeNull()
  })

  it('does not save partial profile when only LSAT is entered', async () => {
    render(<ProfileForm />, { wrapper })
    await userEvent.type(screen.getByLabelText('LSAT'), '172')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(localStorage.getItem('lst.profile')).toBeNull()
  })

  it('saves and shows checkmark on valid submit', async () => {
    render(<ProfileForm />, { wrapper })
    await userEvent.type(screen.getByLabelText('GPA'), '3.8')
    await userEvent.type(screen.getByLabelText('LSAT'), '172')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(screen.getByText('✓ Saved')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('lst.profile')!)).toEqual({ gpa: 3.8, lsat: 172 })
  })

  it('resets checkmark when user edits GPA after saving', async () => {
    render(<ProfileForm />, { wrapper })
    await userEvent.type(screen.getByLabelText('GPA'), '3.8')
    await userEvent.type(screen.getByLabelText('LSAT'), '172')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(screen.getByText('✓ Saved')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('GPA'), '4')
    expect(screen.queryByText('✓ Saved')).not.toBeInTheDocument()
  })

  it('Save button is reachable via keyboard tab order', () => {
    render(<ProfileForm />, { wrapper })
    const button = screen.getByRole('button', { name: 'Save profile' })
    expect(button).not.toHaveAttribute('tabindex', '-1')
  })
})
