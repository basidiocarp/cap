import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { EcosystemStatus, StipeRepairPlan } from '../lib/api'
import { createEcosystemStatus } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { Onboard } from './Onboard'

const refreshAll = vi.fn()
const runAction = vi.fn()
const refetchStatus = vi.fn()
let mockStatus: EcosystemStatus | null = createEcosystemStatus()
let mockStatusError: Error | null = null

function createRepairPlan(): StipeRepairPlan {
  return {
    doctor: {
      checks: [
        {
          message: 'Codex notify is missing',
          name: 'codex-notify',
          passed: false,
          repair_actions: [],
        },
      ],
      healthy: false,
      repair_actions: [
        {
          action_key: 'doctor',
          args: ['doctor'],
          command: 'stipe doctor',
          description: 'Run doctor',
          label: 'Run stipe doctor',
          tier: 'primary',
        },
      ],
      summary: 'Codex setup needs repair.',
    },
    init_plan: {
      detected_clients: ['codex'],
      dry_run: true,
      repair_actions: [],
      steps: [
        {
          detail: 'Add notify contract',
          status: 'planned',
          title: 'Configure Codex notify',
        },
      ],
      target_client: 'codex',
    },
  }
}

vi.mock('../lib/ecosystem-status', () => ({
  useEcosystemStatusController: () => ({
    refreshAll,
    repairPlanQuery: {
      data: createRepairPlan(),
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

vi.mock('../lib/stipe-actions', () => ({
  useStipeActionController: () => ({
    actionIsRunning: () => false,
    actionWasLastRun: () => false,
    runAction,
    runStipe: { error: null, isError: false, isPending: false, isSuccess: false, reset: vi.fn() },
  }),
}))

vi.mock('./onboard/OnboardCoverageSection', () => ({
  OnboardCoverageSection: ({
    codexGuidance,
    hostCoverageMode,
    onModeChange,
  }: {
    codexGuidance: string
    hostCoverageMode: string
    onModeChange: (mode: 'claude') => void
  }) => (
    <div>
      <div>Coverage mode: {hostCoverageMode}</div>
      <div>{codexGuidance}</div>
      <button
        onClick={() => onModeChange('claude')}
        type='button'
      >
        Switch to Claude coverage
      </button>
    </div>
  ),
}))

vi.mock('./onboard/OnboardDetectedIssuesSection', () => ({
  OnboardDetectedIssuesSection: ({ checks }: { checks: Array<{ name: string }> }) => <div>Detected issues: {checks.length}</div>,
}))

vi.mock('./onboard/OnboardInitPlanSection', () => ({
  OnboardInitPlanSection: ({ steps }: { steps: Array<{ title: string }> }) => (
    <div>Init steps: {steps.map((step) => step.title).join(', ')}</div>
  ),
}))

vi.mock('./onboard/OnboardingActionsLayout', () => ({
  OnboardingActionsLayout: ({
    groups,
    onRun,
  }: {
    groups: { primary: Array<{ label: string }> }
    onRun: (action: { label: string; runAction?: string }) => void
  }) => (
    <div>
      <div>Primary actions: {groups.primary.length}</div>
      <button
        onClick={() => onRun({ label: 'Run stipe doctor', runAction: 'doctor' })}
        type='button'
      >
        Run first onboarding action
      </button>
    </div>
  ),
}))

vi.mock('../components/StipeActionFeedback', () => ({
  StipeActionFeedback: () => <div>Stipe action feedback</div>,
}))

describe('Onboard page', () => {
  beforeEach(() => {
    refreshAll.mockClear()
    refetchStatus.mockClear()
    runAction.mockClear()
    mockStatus = createEcosystemStatus()
    mockStatusError = null
  })

  it('renders onboarding state and wires refresh and action controls', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Onboard />, { route: '/onboard' })

    expect(screen.getByRole('heading', { name: 'Onboarding' })).toBeInTheDocument()
    expect(screen.getByText('Codex setup needs repair.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to status' })).toHaveAttribute('href', '/status')
    expect(screen.getByText('Detected issues: 1')).toBeInTheDocument()
    expect(screen.getByText(/Init steps: Configure Codex notify/)).toBeInTheDocument()
    expect(screen.getByText('Primary actions: 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(refreshAll).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Run first onboarding action' }))
    expect(runAction).toHaveBeenCalledWith('doctor')
  })

  it('renders an explicit unavailable state when onboarding cannot load status', async () => {
    mockStatus = null
    mockStatusError = new Error('Status snapshot missing')
    const user = userEvent.setup()

    renderWithProviders(<Onboard />, { route: '/onboard' })

    expect(screen.getByRole('heading', { name: 'Onboarding' })).toBeInTheDocument()
    expect(screen.getByText('Onboarding is unavailable')).toBeInTheDocument()
    expect(screen.getByText(/could not load the current ecosystem status/i)).toBeInTheDocument()
    expect(screen.getByText('Status snapshot missing')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open status' })).toHaveAttribute('href', '/status')
    expect(screen.getByRole('link', { name: 'Open settings' })).toHaveAttribute('href', '/settings')

    await user.click(screen.getByRole('button', { name: 'Retry loading onboarding' }))
    expect(refreshAll).toHaveBeenCalled()
  })
})
