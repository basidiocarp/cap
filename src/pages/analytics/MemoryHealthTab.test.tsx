import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { HyphaeAnalytics } from '../../lib/api'
import { renderWithProviders } from '../../test/render'
import { MemoryHealthTab } from './MemoryHealthTab'

vi.mock('@mantine/charts', () => ({
  BarChart: ({ data }: { data: Array<{ importance: string }> }) => <div data-testid='importance-chart'>{JSON.stringify(data)}</div>,
}))

function createAnalytics(overrides: Partial<HyphaeAnalytics> = {}): HyphaeAnalytics {
  return {
    importance_distribution: { critical: 4, ephemeral: 0, high: 3, low: 1, medium: 2 },
    lifecycle: {
      avg_weight: 0.71,
      created_last_7d: 6,
      created_last_30d: 11,
      decayed: 2,
      min_weight: 0.12,
      pruned: 1,
    },
    memoir_stats: { code_memoirs: 2, total: 4, total_concepts: 28, total_links: 16 },
    memory_utilization: { rate: 0.5, recalled: 10, total: 20 },
    search_stats: { empty_results: 1, hit_rate: 0.8, total_searches: 5 },
    top_topics: [
      {
        avg_weight: 0.84,
        count: 5,
        latest_created_at: '2026-03-30T18:00:00Z',
        name: 'decisions/api',
      },
    ],
    ...overrides,
  }
}

describe('MemoryHealthTab', () => {
  it('splits importance into comparable buckets and keeps the summary readable', () => {
    renderWithProviders(<MemoryHealthTab data={createAnalytics()} />)

    expect(screen.getByText('Importance Distribution')).toBeInTheDocument()
    expect(screen.getByText(/Each bucket is shown separately/i)).toBeInTheDocument()
    expect(screen.getByText('critical')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
    expect(screen.getByText('low')).toBeInTheDocument()
    expect(screen.getByText('ephemeral')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()

    const chart = JSON.parse(screen.getByTestId('importance-chart').textContent ?? '[]') as Array<{ importance: string }>
    expect(chart.map((row) => row.importance)).toEqual(['critical', 'high', 'medium', 'low', 'ephemeral'])
  })
})
