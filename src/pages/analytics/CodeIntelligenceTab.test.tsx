import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { RhizomeAnalytics } from '../../lib/api'
import { renderWithProviders } from '../../test/render'
import { CodeIntelligenceTab } from './CodeIntelligenceTab'

vi.mock('@mantine/charts', () => ({
  BarChart: ({ data }: { data: Array<{ tool: string }> }) => (
    <div data-testid='tool-chart'>{JSON.stringify(data)}</div>
  ),
}))

function createAnalytics(overrides: Partial<RhizomeAnalytics> = {}): RhizomeAnalytics {
  return {
    available: true,
    backend_usage: { lsp: true, treesitter: true },
    languages: [
      { detection: 'tree-sitter', language: 'typescript' },
      { detection: 'lsp', language: 'rust' },
    ],
    supported_tools: ['get_symbols', 'get_dependencies'],
    tool_calls: [
      { avg_duration_ms: 2500, count: 2, tool: 'get_symbols' },
      { avg_duration_ms: 1000, count: 1, tool: 'get_dependencies' },
    ],
    ...overrides,
  }
}

describe('CodeIntelligenceTab', () => {
  it('shows mixed backend state and compares tool calls by count and duration', () => {
    renderWithProviders(<CodeIntelligenceTab data={createAnalytics()} />)

    expect(screen.getByText('Mixed backend support')).toBeInTheDocument()
    expect(screen.getByText(/Backend state is shown directly/i)).toBeInTheDocument()
    expect(screen.getByText(/Across 3 tool calls/i)).toBeInTheDocument()
    expect(screen.getByText('Tool Call Comparison')).toBeInTheDocument()
    expect(screen.getAllByText('get_symbols')).toHaveLength(2)
    expect(screen.getByText('2.5 s')).toBeInTheDocument()
    expect(screen.getByText('1.0 s')).toBeInTheDocument()

    const chart = JSON.parse(screen.getByTestId('tool-chart').textContent ?? '[]') as Array<{ tool: string }>
    expect(chart.map((row) => row.tool)).toEqual(['get_symbols', 'get_dependencies'])
  })
})
