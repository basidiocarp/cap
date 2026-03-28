import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { createEcosystemStatus } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { StatusGettingStartedCard } from './StatusGettingStartedCard'

const runAction = vi.fn()

vi.mock('../../components/ProjectContextSummary', () => ({
  ProjectContextSummary: ({ activeProject }: { activeProject?: string }) => <div>Project context: {activeProject}</div>,
}))

vi.mock('../../components/StipeActionFeedback', () => ({
  StipeActionFeedback: () => <div>Stipe feedback</div>,
}))

vi.mock('../../lib/stipe-actions', () => ({
  useStipeActionController: () => ({
    actionIsRunning: () => false,
    runAction,
    runStipe: { error: null, isError: false, isPending: false, isSuccess: false, reset: vi.fn() },
  }),
}))

describe('StatusGettingStartedCard', () => {
  it('shows readiness badges and forwards the recommended action', async () => {
    const user = userEvent.setup()
    const onRefresh = vi.fn()
    const status = createEcosystemStatus()

    renderWithProviders(
      <StatusGettingStartedCard
        hostCoverageMode='both'
        onRefresh={onRefresh}
        status={status}
      />
    )

    expect(screen.getAllByText('Codex + Claude ready')).not.toHaveLength(0)
    expect(screen.getByText('Flowing')).toBeInTheDocument()
    expect(screen.getByText(/Best next step:/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Open onboarding' })[0]).toHaveAttribute('href', '/onboard')
    expect(screen.getByRole('link', { name: 'Latest session' })).toHaveAttribute('href', '/sessions?detail=latest')
    expect(screen.getByRole('link', { name: 'Session timeline' })).toHaveAttribute('href', '/sessions')

    await user.click(screen.getByRole('button', { name: /run recommended step/i }))
    expect(runAction).toHaveBeenCalledWith('doctor')

    await user.click(screen.getByRole('button', { name: /refresh status/i }))
    expect(onRefresh).toHaveBeenCalled()
  })
})
