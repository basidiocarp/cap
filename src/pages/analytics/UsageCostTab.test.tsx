import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { SessionUsage, UsageAggregate } from '../../lib/api'
import { renderWithProviders } from '../../test/render'
import { USAGE_COST_CHART_DIMENSIONS, UsageCostTab } from './UsageCostTab'

function createAggregate(overrides: Partial<UsageAggregate> = {}): UsageAggregate {
  return {
    avg_cost_per_session: 2.5,
    cache_hit_rate: 0.25,
    total_cache_tokens: 120,
    sessions: 2,
    total_cost: 5,
    total_input_tokens: 1200,
    total_output_tokens: 800,
    ...overrides,
  }
}

function createSessionUsage(overrides: Partial<SessionUsage> = {}): SessionUsage {
  return {
    cache_tokens: 120,
    cost_known: true,
    duration_messages: 4,
    estimated_cost: 1.5,
    input_tokens: 600,
    model: 'claude-3.5-sonnet',
    output_tokens: 400,
    provider: 'anthropic',
    project: 'cap',
    runtime: 'claude-code',
    session_id: 'ses-1',
    timestamp: '2026-04-01T12:00:00Z',
    ...overrides,
  }
}

describe('UsageCostTab', () => {
  it('labels the surface as usage history only instead of host coverage', () => {
    renderWithProviders(
      <UsageCostTab
        aggregate={createAggregate()}
        sessions={[
          createSessionUsage({ runtime: 'codex', session_id: 'ses-codex', timestamp: '2026-04-01T12:00:00Z' }),
          createSessionUsage({ runtime: 'claude-code', session_id: 'ses-claude', timestamp: '2026-04-02T12:00:00Z' }),
        ]}
        trend={null}
      />
    )

    expect(screen.getByText('Usage history only')).toBeInTheDocument()
    expect(screen.getByText(/This tab shows parsed session history only/i)).toBeInTheDocument()
    expect(screen.getByText(/Seen in history: 1 Codex · 1 Claude Code/i)).toBeInTheDocument()
    expect(screen.getByText(/Codex sessions are parsed from the local Codex sessions directory/i)).toBeInTheDocument()
  })

  it('uses non-negative initial dimensions for the Recharts containers', () => {
    expect(USAGE_COST_CHART_DIMENSIONS).toEqual({
      height: 250,
      initialDimension: { height: 0, width: 0 },
      minHeight: 250,
      minWidth: 100,
      width: '100%',
    })
  })
})
