import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { EcosystemSettings } from '../lib/api'
import { renderWithProviders } from '../test/render'
import { Settings } from './Settings'

const refetchSettings = vi.fn()
const updateMycelium = vi.fn()
const updateRhizome = vi.fn()
let mockSettings: EcosystemSettings | null = null

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
    data: mockSettings,
    error: new Error('Failed to read settings'),
    isLoading: false,
    refetch: refetchSettings,
  }),
  useUpdateMycelium: () => ({ isError: false, mutate: updateMycelium }),
  useUpdateRhizome: () => ({ isError: false, mutate: updateRhizome }),
}))

vi.mock('./settings/LspManager', () => ({
  LspManager: () => <div>LSP manager</div>,
}))

describe('Settings page', () => {
  beforeEach(() => {
    refetchSettings.mockClear()
    updateMycelium.mockClear()
    updateRhizome.mockClear()
    mockSettings = null
  })

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

  it('renders direct operational links from each tool card when settings are available', () => {
    mockSettings = {
      hyphae: {
        config_path: '/Users/test/.config/hyphae/config.toml',
        config_present: true,
        config_source: 'config_file',
        db_path: '/Users/test/.local/share/hyphae.db',
        db_size_bytes: 1024,
        db_source: 'platform_default',
        resolved_config_path: '/Users/test/.config/hyphae/config.toml',
      },
      mycelium: {
        config_path: '/Users/test/.config/mycelium/config.toml',
        config_present: true,
        config_source: 'config_file',
        filters: {
          hyphae: { enabled: true },
          rhizome: { enabled: true },
        },
        resolved_config_path: '/Users/test/.config/mycelium/config.toml',
      },
      rhizome: {
        auto_export: true,
        config_path: '/Users/test/.config/rhizome/config.toml',
        config_present: true,
        config_source: 'config_file',
        languages_enabled: 3,
        resolved_config_path: '/Users/test/.config/rhizome/config.toml',
      },
    }

    renderWithProviders(<Settings />, { route: '/settings' })

    expect(screen.getByRole('link', { name: 'Open analytics' })).toHaveAttribute('href', '/analytics')
    expect(screen.getByRole('link', { name: 'Open memories' })).toHaveAttribute('href', '/memories')
    expect(screen.getByRole('link', { name: 'Open memoirs' })).toHaveAttribute('href', '/memoirs')
    expect(screen.getByRole('link', { name: 'Open code explorer' })).toHaveAttribute('href', '/code')
    expect(screen.getAllByText('Resolved config file')).toHaveLength(3)
    expect(screen.getByText('/Users/test/.config/hyphae/config.toml')).toBeInTheDocument()
    expect(screen.getAllByText('Config file').length).toBeGreaterThan(0)
  })
})
