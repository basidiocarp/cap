import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { AnnulusStatus } from '../lib/api'
import * as queries from '../lib/queries'
import { renderWithProviders } from '../test/render'
import { EcosystemStatusPanel } from './EcosystemStatusPanel'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type MockStatusHook = ReturnType<typeof queries.useAnnulusStatus>

function mockStatus(data: AnnulusStatus | undefined) {
  vi.spyOn(queries, 'useAnnulusStatus').mockReturnValue({
    data,
  } as unknown as MockStatusHook)
}

const fullStatus: AnnulusStatus = {
  available: true,
  reports: [
    { available: true, degraded_capabilities: [], tier: 'tier1', tool: 'mycelium' },
    { available: true, degraded_capabilities: ['search'], tier: 'tier2', tool: 'hyphae' },
    { available: false, degraded_capabilities: [], tier: 'tier3', tool: 'rhizome' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('EcosystemStatusPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders tool badges grouped by tier when data is available', () => {
    mockStatus(fullStatus)
    renderWithProviders(<EcosystemStatusPanel />)

    expect(screen.getByText('mycelium')).toBeInTheDocument()
    expect(screen.getByText('hyphae')).toBeInTheDocument()
    expect(screen.getByText('rhizome')).toBeInTheDocument()
    expect(screen.getByText('Tier 1')).toBeInTheDocument()
    expect(screen.getByText('Tier 2')).toBeInTheDocument()
    expect(screen.getByText('Tier 3')).toBeInTheDocument()
  })

  it('renders muted unavailable text when annulus is not available', () => {
    mockStatus({ available: false, reports: [] })
    renderWithProviders(<EcosystemStatusPanel />)

    expect(screen.getByText('Ecosystem status unavailable')).toBeInTheDocument()
  })

  it('renders muted unavailable text when data is undefined', () => {
    mockStatus(undefined)
    renderWithProviders(<EcosystemStatusPanel />)

    expect(screen.getByText('Ecosystem status unavailable')).toBeInTheDocument()
  })

  it('dismisses the panel when the dismiss button is clicked', async () => {
    const user = userEvent.setup()
    mockStatus(fullStatus)

    renderWithProviders(<EcosystemStatusPanel />)

    expect(screen.getByText('mycelium')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dismiss ecosystem status panel' }))

    await waitFor(() => {
      expect(screen.queryByText('mycelium')).not.toBeInTheDocument()
    })
  })

  it('omits tiers that have no reports', () => {
    mockStatus({
      available: true,
      reports: [{ available: true, degraded_capabilities: [], tier: 'tier1', tool: 'mycelium' }],
    })

    renderWithProviders(<EcosystemStatusPanel />)

    expect(screen.getByText('Tier 1')).toBeInTheDocument()
    expect(screen.queryByText('Tier 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Tier 3')).not.toBeInTheDocument()
  })
})
