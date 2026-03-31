import { beforeEach, describe, expect, it, vi } from 'vitest'

const runCliMock = vi.fn()

vi.mock('../lib/cli.ts', () => ({
  createCliRunner: vi.fn(() => runCliMock),
}))

vi.mock('../lib/config.ts', () => ({
  HYPHAE_BIN: 'hyphae-test',
}))

vi.mock('../logger.ts', () => ({
  logger: {
    debug: vi.fn(),
  },
}))

describe('Hyphae analytics CLI consumer', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('accepts the owned analytics payload from the Hyphae CLI surface', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        analytics: {
          importance_distribution: { critical: 1, ephemeral: 0, high: 4, low: 2, medium: 3 },
          lifecycle: {
            avg_weight: 0.71,
            created_last_7d: 6,
            created_last_30d: 11,
            decayed: 2,
            min_weight: 0.12,
            pruned: 0,
          },
          memoir_stats: { code_memoirs: 3, total: 4, total_concepts: 28, total_links: 16 },
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
        },
        schema_version: '1.0',
      })
    )

    const { getAnalytics } = await import('../hyphae/analytics.ts')
    await expect(getAnalytics()).resolves.toEqual({
      importance_distribution: { critical: 1, ephemeral: 0, high: 4, low: 2, medium: 3 },
      lifecycle: {
        avg_weight: 0.71,
        created_last_7d: 6,
        created_last_30d: 11,
        decayed: 2,
        min_weight: 0.12,
        pruned: 0,
      },
      memoir_stats: { code_memoirs: 3, total: 4, total_concepts: 28, total_links: 16 },
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
    })
    expect(runCliMock).toHaveBeenCalledWith(['--all-projects', 'analytics'])
  })

  it('rejects malformed analytics payloads', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ analytics: { top_topics: [] } }))

    const { getAnalytics } = await import('../hyphae/analytics.ts')
    await expect(getAnalytics()).rejects.toThrow('Hyphae analytics returned an invalid payload')
  })

  it('rejects analytics payloads without a schema version', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        analytics: {
          importance_distribution: { critical: 1, ephemeral: 0, high: 4, low: 2, medium: 3 },
          lifecycle: {
            avg_weight: 0.71,
            created_last_7d: 6,
            created_last_30d: 11,
            decayed: 2,
            min_weight: 0.12,
            pruned: 0,
          },
          memoir_stats: { code_memoirs: 3, total: 4, total_concepts: 28, total_links: 16 },
          memory_utilization: { rate: 0.5, recalled: 10, total: 20 },
          search_stats: { empty_results: 1, hit_rate: 0.8, total_searches: 5 },
          top_topics: [],
        },
      })
    )

    const { getAnalytics } = await import('../hyphae/analytics.ts')
    await expect(getAnalytics()).rejects.toThrow('Hyphae analytics returned an invalid payload')
  })
})
