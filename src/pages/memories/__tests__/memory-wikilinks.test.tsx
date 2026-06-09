import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../test/render'
import { renderWithWikilinks } from '../memory-wikilinks'

describe('renderWithWikilinks', () => {
  it('renders plain text with no tokens', () => {
    const onNavigate = vi.fn()
    const text = 'This is plain text with no wikilinks'

    renderWithProviders(<div>{renderWithWikilinks(text, onNavigate)}</div>)

    expect(screen.getByText('This is plain text with no wikilinks')).toBeInTheDocument()
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('renders a clickable element for [[target]]', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    const text = 'See [[project_foo]] for details'

    renderWithProviders(<div>{renderWithWikilinks(text, onNavigate)}</div>)

    const link = screen.getByRole('button', { name: 'project_foo' })
    expect(link).toBeInTheDocument()

    await user.click(link)
    expect(onNavigate).toHaveBeenCalledWith('project_foo')
  })

  it('preserves text before and after the token', () => {
    const onNavigate = vi.fn()
    const text = 'before [[middle]] after'

    const { container } = renderWithProviders(<div>{renderWithWikilinks(text, onNavigate)}</div>)

    expect(container.textContent).toContain('before')
    expect(screen.getByRole('button', { name: 'middle' })).toBeInTheDocument()
    expect(container.textContent).toContain('after')
  })

  it('treats [[]] (empty) as literal text', () => {
    const onNavigate = vi.fn()
    const text = 'text [[]] more text'

    renderWithProviders(<div>{renderWithWikilinks(text, onNavigate)}</div>)

    expect(screen.getByText(/\[\[\]\]/)).toBeInTheDocument()
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('handles multiple wikilinks in text', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    const text = '[[first]] and [[second]]'

    renderWithProviders(<div>{renderWithWikilinks(text, onNavigate)}</div>)

    const firstButton = screen.getByRole('button', { name: 'first' })
    const secondButton = screen.getByRole('button', { name: 'second' })

    expect(firstButton).toBeInTheDocument()
    expect(secondButton).toBeInTheDocument()

    await user.click(firstButton)
    expect(onNavigate).toHaveBeenCalledWith('first')

    await user.click(secondButton)
    expect(onNavigate).toHaveBeenCalledWith('second')
  })

  it('trims whitespace from wikilink targets', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    const text = '[[ spaced_target ]]'

    renderWithProviders(<div>{renderWithWikilinks(text, onNavigate)}</div>)

    const link = screen.getByRole('button', { name: 'spaced_target' })

    await user.click(link)
    expect(onNavigate).toHaveBeenCalledWith('spaced_target')
  })

  it('treats whitespace-only [[  ]] as literal text', () => {
    const onNavigate = vi.fn()
    const text = 'text [[  ]] more'

    renderWithProviders(<div>{renderWithWikilinks(text, onNavigate)}</div>)

    expect(screen.getByText(/\[\[\s+\]\]/)).toBeInTheDocument()
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
