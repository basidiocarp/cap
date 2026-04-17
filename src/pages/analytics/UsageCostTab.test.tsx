import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { SessionUsage, UsageAggregate } from '../../lib/api'
import { renderWithProviders } from '../../test/render'
import { UsageCostTab } from './UsageCostTab'

function createAggregate(overrides: Partial<UsageAggregate> = {}): UsageAggregate {
  return {
    avg_cost_per_session: 2.5,
    cache_hit_rate: 0.25,
    sessions: 2,
    total_cache_tokens: 120,
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
    project: 'cap',
    provider: 'anthropic',
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

  it('renders with trend data', () => {
    const trend = [
      { cost: 5.0, date: '2026-04-01', input_tokens: 1000, output_tokens: 500, sessions: 3 },
      { cost: 6.5, date: '2026-04-02', input_tokens: 1200, output_tokens: 600, sessions: 4 },
    ]
    renderWithProviders(
      <UsageCostTab
        aggregate={createAggregate()}
        sessions={null}
        trend={trend}
      />
    )

    expect(screen.getByText('Daily Cost Trend')).toBeInTheDocument()
    expect(screen.getByText('Token Usage by Day')).toBeInTheDocument()
  })
})
