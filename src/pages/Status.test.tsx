import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { EcosystemStatus } from '../lib/api'
import { createEcosystemStatus } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { Status } from './Status'

const refreshAll = vi.fn()
const refetchStatus = vi.fn()
let mockStatus: EcosystemStatus | null = createEcosystemStatus()
let mockStatusError: Error | null = null

vi.mock('../lib/ecosystem-status', () => ({
  useEcosystemStatusController: () => ({
    refreshAll,
    repairPlanQuery: {
      data: {
        doctor: { checks: [], healthy: true, repair_actions: [], summary: 'Healthy' },
        init_plan: { detected_clients: ['codex'], dry_run: true, repair_actions: [], steps: [] },
      },
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    },
    statusQuery: {
      data: mockStatus,
      error: mockStatusError,
      isLoading: false,
      refetch: refetchStatus,
    },
  }),
}))

vi.mock('./status/StatusHeader', () => ({
  StatusHeader: ({ onRefresh }: { onRefresh: () => void }) => (
    <div>
      <div>Ecosystem Status</div>
      <button
        onClick={onRefresh}
        type='button'
      >
        Refresh status header
      </button>
    </div>
  ),
}))

vi.mock('./status/StatusGettingStartedCard', () => ({
  StatusGettingStartedCard: ({ hostCoverageMode, onRefresh }: { hostCoverageMode: string; onRefresh: () => void }) => (
    <div>
      <div>Getting started mode: {hostCoverageMode}</div>
      <button
        onClick={onRefresh}
        type='button'
      >
        Refresh getting started
      </button>
    </div>
  ),
}))

vi.mock('./status/StatusArchitectureCard', () => ({
  StatusArchitectureCard: () => <div>Architecture card</div>,
}))

vi.mock('./status/StatusOverviewGrid', () => ({
  StatusOverviewGrid: ({ onRefresh }: { onRefresh: () => void }) => (
    <div>
      <div>Overview grid</div>
      <button
        onClick={onRefresh}
        type='button'
      >
        Refresh overview
      </button>
    </div>
  ),
}))

vi.mock('./status/LanguageServersCard', () => ({
  LanguageServersCard: () => <div>Language servers card</div>,
}))

vi.mock('./status/LifecycleAdaptersCard', () => ({
  LifecycleAdaptersCard: () => <div>Lifecycle adapters card</div>,
}))

describe('Status page', () => {
  beforeEach(() => {
    refreshAll.mockClear()
    refetchStatus.mockClear()
    mockStatus = createEcosystemStatus()
    mockStatusError = null
  })

  it('renders status sections and shares refresh across page cards', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Status />, { route: '/status' })

    expect(screen.getByText('Ecosystem Status')).toBeInTheDocument()
    expect(screen.getByText('Getting started mode: auto')).toBeInTheDocument()
    expect(screen.getByText('Architecture card')).toBeInTheDocument()
    expect(screen.getByText('Overview grid')).toBeInTheDocument()
    expect(screen.getByText('Language servers card')).toBeInTheDocument()
    expect(screen.getByText('Lifecycle adapters card')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Refresh status header' }))
    await user.click(screen.getByRole('button', { name: 'Refresh getting started' }))
    await user.click(screen.getByRole('button', { name: 'Refresh overview' }))

    expect(refreshAll).toHaveBeenCalledTimes(3)
  })

  it('renders an explicit unavailable state when status data is missing', async () => {
    mockStatus = null
    mockStatusError = new Error('Status backend unavailable')
    const user = userEvent.setup()

    renderWithProviders(<Status />, { route: '/status' })

    expect(screen.getByText('Status is unavailable')).toBeInTheDocument()
    expect(screen.getByText(/could not load ecosystem status/i)).toBeInTheDocument()
    expect(screen.getByText('Status backend unavailable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open onboarding' })).toHaveAttribute('href', '/onboard')
    expect(screen.getByRole('link', { name: 'Open settings' })).toHaveAttribute('href', '/settings')

    await user.click(screen.getByRole('button', { name: 'Retry loading status' }))
    expect(refreshAll).toHaveBeenCalled()
  })
})
