import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { StipeRepairPlan } from '../lib/api'
import { createEcosystemStatus } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { Onboard } from './Onboard'

const refreshAll = vi.fn()
const runAction = vi.fn()

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
      data: createEcosystemStatus(),
      error: null,
      isLoading: false,
      refetch: vi.fn(),
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
})
