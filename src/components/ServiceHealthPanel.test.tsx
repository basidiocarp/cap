import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as queries from '../lib/queries'
import { createEcosystemStatus } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { ServiceHealthPanel } from './ServiceHealthPanel'

type MockStatusHook = ReturnType<typeof queries.useEcosystemStatus>

function mockStatus(overrides: Parameters<typeof createEcosystemStatus>[0] = {}) {
  vi.spyOn(queries, 'useEcosystemStatus').mockReturnValue({
    data: createEcosystemStatus(overrides),
  } as unknown as MockStatusHook)
}

function mockNoData() {
  vi.spyOn(queries, 'useEcosystemStatus').mockReturnValue({
    data: undefined,
  } as unknown as MockStatusHook)
}

describe('ServiceHealthPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when all tools are available', () => {
    mockStatus()

    renderWithProviders(<ServiceHealthPanel />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders nothing when status data is not yet loaded', () => {
    mockNoData()

    renderWithProviders(<ServiceHealthPanel />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a red banner when a Tier 1 tool (mycelium) is down', () => {
    mockStatus({ mycelium: { available: false, version: null } })

    renderWithProviders(<ServiceHealthPanel />)

    expect(screen.getByText('Core tool unavailable')).toBeInTheDocument()
    expect(screen.getByText('mycelium')).toBeInTheDocument()
  })

  it('shows a red banner when a Tier 1 tool (rhizome) is down', () => {
    mockStatus({ rhizome: { available: false, backend: null, languages: [] } })

    renderWithProviders(<ServiceHealthPanel />)

    expect(screen.getByText('Core tool unavailable')).toBeInTheDocument()
    expect(screen.getByText('rhizome')).toBeInTheDocument()
  })

  it('shows an amber banner when only a Tier 2 tool (hyphae) is down', () => {
    mockStatus({
      hyphae: {
        activity: {
          codex_memory_count: 0,
          last_codex_memory_at: null,
          last_session_memory_at: null,
          last_session_topic: null,
          recent_session_memory_count: 0,
        },
        available: false,
        memoirs: 0,
        memories: 0,
        version: null,
      },
    })

    renderWithProviders(<ServiceHealthPanel />)

    expect(screen.getByText('Tool degraded')).toBeInTheDocument()
    expect(screen.getByText('hyphae')).toBeInTheDocument()
  })

  it('shows both down tools when multiple tools are unavailable', () => {
    mockStatus({
      mycelium: { available: false, version: null },
      rhizome: { available: false, backend: null, languages: [] },
    })

    renderWithProviders(<ServiceHealthPanel />)

    expect(screen.getByText('mycelium')).toBeInTheDocument()
    expect(screen.getByText('rhizome')).toBeInTheDocument()
  })

  it('dismisses the banner when the close button is clicked', async () => {
    const user = userEvent.setup()
    mockStatus({ mycelium: { available: false, version: null } })

    renderWithProviders(<ServiceHealthPanel />)

    expect(screen.getByText('Core tool unavailable')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dismiss health banner' }))

    expect(screen.queryByText('Core tool unavailable')).not.toBeInTheDocument()
  })

  it('includes a dismiss button with accessible label', () => {
    mockStatus({ mycelium: { available: false, version: null } })

    renderWithProviders(<ServiceHealthPanel />)

    expect(screen.getByRole('button', { name: 'Dismiss health banner' })).toBeInTheDocument()
  })
})
