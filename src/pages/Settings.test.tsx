import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../test/render'
import { Settings } from './Settings'

const refetchSettings = vi.fn()

vi.mock('../lib/queries', () => ({
  useActivateMode: () => ({ mutate: vi.fn() }),
  useModes: () => ({
    data: {
      active: 'develop',
      modes: {
        develop: { description: 'Build and iterate', hyphae_tools: [], rhizome_tools: [] },
      },
    },
  }),
  usePruneHyphae: () => ({ isError: false, isPending: false, isSuccess: false, mutate: vi.fn() }),
  useSettings: () => ({
    data: null,
    error: new Error('Failed to read settings'),
    isLoading: false,
    refetch: refetchSettings,
  }),
  useUpdateMycelium: () => ({ isError: false, mutate: vi.fn() }),
  useUpdateRhizome: () => ({ isError: false, mutate: vi.fn() }),
}))

vi.mock('./settings/LspManager', () => ({
  LspManager: () => <div>LSP manager</div>,
}))

describe('Settings page', () => {
  it('renders an explicit unavailable state and retry action when settings cannot load', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Settings />, { route: '/settings' })

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText('Settings are unavailable')).toBeInTheDocument()
    expect(screen.getByText(/Cap could not load tool settings/i)).toBeInTheDocument()
    expect(screen.getByText('Failed to read settings')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open status' })).toHaveAttribute('href', '/status')
    expect(screen.getByRole('link', { name: 'Open onboarding' })).toHaveAttribute('href', '/onboard')

    await user.click(screen.getByRole('button', { name: 'Retry loading settings' }))
    expect(refetchSettings).toHaveBeenCalled()
  })
})
