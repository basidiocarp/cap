import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createEcosystemStatus } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { Status } from './Status'

const refreshAll = vi.fn()

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
      data: createEcosystemStatus(),
      error: null,
      isLoading: false,
      refetch: vi.fn(),
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
})
