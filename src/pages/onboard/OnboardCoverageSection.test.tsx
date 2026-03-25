import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { getEcosystemReadinessModel } from '../../lib/readiness'
import { createEcosystemStatus } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { OnboardCoverageSection } from './OnboardCoverageSection'

vi.mock('../../components/ProjectContextSummary', () => ({
  ProjectContextSummary: ({ activeProject }: { activeProject?: string }) => <div>Project context: {activeProject}</div>,
}))

describe('OnboardCoverageSection', () => {
  it('renders fallback and lifecycle guidance and forwards quick actions', async () => {
    const user = userEvent.setup()
    const onModeChange = vi.fn()
    const onRefresh = vi.fn()
    const onRun = vi.fn()
    const status = createEcosystemStatus({
      hooks: {
        error_count: 0,
        installed_hooks: [],
        lifecycle: [
          { event: 'PostToolUse', installed: false, matching_hooks: 0 },
          { event: 'SessionEnd', installed: false, matching_hooks: 0 },
        ],
        recent_errors: [],
      },
      hyphae: {
        activity: {
          codex_memory_count: 0,
          last_codex_memory_at: null,
          last_session_memory_at: null,
          last_session_topic: null,
          recent_session_memory_count: 0,
        },
        available: true,
        memoirs: 7,
        memories: 42,
        version: '0.9.1',
      },
    })

    renderWithProviders(
      <OnboardCoverageSection
        codexGuidance='Codex setup is active, but memory flow still needs verification.'
        hostCoverageMode='auto'
        lifecycleGaps={['PostToolUse', 'SessionEnd']}
        onModeChange={onModeChange}
        onRefresh={onRefresh}
        onRun={onRun}
        readiness={getEcosystemReadinessModel(status)}
        repairPlanUnavailable
        status={status}
      />
    )

    expect(screen.getByText('Codex setup is active, but memory flow still needs verification.')).toBeInTheDocument()
    expect(screen.getByText(/Missing recommended lifecycle events: PostToolUse, SessionEnd/i)).toBeInTheDocument()
    expect(screen.getByText(/Structured Stipe repair data was unavailable/i)).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Claude focus' }))
    expect(onModeChange).toHaveBeenCalledWith('claude')

    await user.click(screen.getByRole('button', { name: /refresh status/i }))
    expect(onRefresh).toHaveBeenCalled()
  })
})
