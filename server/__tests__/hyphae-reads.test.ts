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

describe('Hyphae read CLI consumer', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('loads stats from the Hyphae CLI all-projects surface', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        avg_weight: 0.73,
        newest_memory: '2026-03-30T15:00:00Z',
        oldest_memory: '2026-03-29T11:00:00Z',
        total_memories: 12,
        total_topics: 4,
      })
    )

    const { getStatsFromCli } = await import('../hyphae/reads-cli.ts')
    await expect(getStatsFromCli()).resolves.toEqual({
      avg_weight: 0.73,
      newest: '2026-03-30T15:00:00Z',
      oldest: '2026-03-29T11:00:00Z',
      total_memories: 12,
      total_topics: 4,
    })
    expect(runCliMock).toHaveBeenCalledWith(['--all-projects', 'stats', '--include-invalidated', '--json'])
  })

  it('preserves topic-filtered recall through the Hyphae CLI contract', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        limit: 20,
        query: 'local storage',
        results: [
          {
            access_count: 3,
            created_at: '2026-03-30T12:00:00Z',
            id: 'mem_1',
            importance: 'high',
            keywords: ['sqlite', 'storage'],
            last_accessed: '2026-03-30T13:00:00Z',
            raw_excerpt: 'Use sqlite',
            related_ids: ['mem_2'],
            source: { file_path: 'src/db.ts', host: 'codex', session_id: 'ses_1', type: 'agent_session' },
            summary: 'Use sqlite for local storage',
            topic: 'decisions/api',
            updated_at: '2026-03-30T12:10:00Z',
            weight: 0.88,
          },
        ],
        total: 1,
      })
    )

    const { recallFromCli } = await import('../hyphae/reads-cli.ts')
    const result = await recallFromCli('local storage', 'decisions/api', 20)

    expect(runCliMock).toHaveBeenCalledWith([
      '--all-projects',
      'search',
      '--query',
      'local storage',
      '--limit',
      '20',
      '--include-invalidated',
      '--order',
      'rank',
      '--json',
      '--topic',
      'decisions/api',
    ])
    expect(result).toEqual([
      expect.objectContaining({
        id: 'mem_1',
        keywords: '["sqlite","storage"]',
        related_ids: '["mem_2"]',
        source_type: 'agent_session',
      }),
    ])
  })

  it('accepts limited global search results while preserving the total-match contract', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        limit: 1,
        query: 'local storage',
        results: [
          {
            access_count: 3,
            created_at: '2026-03-30T12:00:00Z',
            id: 'mem_1',
            importance: 'high',
            keywords: ['sqlite', 'storage'],
            last_accessed: '2026-03-30T13:00:00Z',
            project: 'cap',
            raw_excerpt: 'Use sqlite',
            related_ids: ['mem_2'],
            source: { file_path: 'src/db.ts', host: 'codex', session_id: 'ses_1', type: 'agent_session' },
            summary: 'Use sqlite for local storage',
            topic: 'decisions/api',
            updated_at: '2026-03-30T12:10:00Z',
            weight: 0.88,
          },
        ],
        total: 3,
      })
    )

    const { searchGlobalFromCli } = await import('../hyphae/reads-cli.ts')
    const result = await searchGlobalFromCli('local storage', 1)

    expect(runCliMock).toHaveBeenCalledWith([
      '--all-projects',
      'search',
      '--query',
      'local storage',
      '--limit',
      '1',
      '--include-invalidated',
      '--order',
      'weight',
      '--json',
    ])
    expect(result).toEqual([
      expect.objectContaining({
        id: 'mem_1',
        project: 'cap',
      }),
    ])
  })

  it('maps health summaries onto the existing Cap route shape', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        topics: [
          {
            avg_weight: 0.61,
            critical_count: 1,
            entry_count: 6,
            high_count: 2,
            low_count: 1,
            low_weight_count: 2,
            medium_count: 2,
            topic: 'decisions/api',
          },
        ],
      })
    )

    const { getHealthFromCli } = await import('../hyphae/reads-cli.ts')
    await expect(getHealthFromCli()).resolves.toEqual([
      {
        avg_weight: 0.61,
        count: 6,
        critical_count: 1,
        high_count: 2,
        low_count: 1,
        low_weight_count: 2,
        medium_count: 2,
        topic: 'decisions/api',
      },
    ])
  })

  it('returns an empty health result when a topic has no memories', async () => {
    runCliMock.mockRejectedValue(new Error('topic: missing'))

    const { getHealthFromCli } = await import('../hyphae/reads-cli.ts')
    await expect(getHealthFromCli('missing')).resolves.toEqual([])
  })

  it('treats Hyphae memory not found as an empty lookup instead of a backend failure', async () => {
    runCliMock.mockRejectedValue(new Error('memory not found: mem_missing'))

    const { getMemoryFromCli } = await import('../hyphae/reads-cli.ts')
    await expect(getMemoryFromCli('mem_missing')).resolves.toBeUndefined()
  })

  it('rejects malformed topic payloads', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ schema_version: '1.0', topics: [{ count: 2, topic: 'decisions/api' }] }))

    const { getTopicsFromCli } = await import('../hyphae/reads-cli.ts')
    await expect(getTopicsFromCli()).rejects.toThrow('Hyphae topics returned an invalid payload')
  })

  it('rejects search payloads that omit the Hyphae total field', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ schema_version: '1.0', results: [] }))

    const { searchGlobalFromCli } = await import('../hyphae/reads-cli.ts')
    await expect(searchGlobalFromCli('local storage', 5)).rejects.toThrow('Hyphae search returned an invalid payload')
  })

  it('rejects stats payloads that omit the schema version', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ avg_weight: 0.73, newest_memory: null, oldest_memory: null, total_memories: 12, total_topics: 4 }))

    const { getStatsFromCli } = await import('../hyphae/reads-cli.ts')
    await expect(getStatsFromCli()).rejects.toThrow('Hyphae stats returned an invalid payload')
  })

  it('sorts ingestion sources by newest activity', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        sources: [
          {
            chunk_count: 3,
            source_path: '/repo/docs/old.md',
            updated_at: '2026-03-29T08:00:00Z',
          },
          {
            chunk_count: 8,
            source_path: '/repo/docs/new.md',
            updated_at: '2026-03-30T18:00:00Z',
          },
        ],
      })
    )

    const { getIngestionSourcesFromCli } = await import('../hyphae/reads-cli.ts')
    await expect(getIngestionSourcesFromCli()).resolves.toEqual([
      {
        chunk_count: 8,
        last_ingested: '2026-03-30T18:00:00Z',
        source_path: '/repo/docs/new.md',
      },
      {
        chunk_count: 3,
        last_ingested: '2026-03-29T08:00:00Z',
        source_path: '/repo/docs/old.md',
      },
    ])
  })

  it('groups ingestion sources by source_path across projects', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        sources: [
          {
            chunk_count: 3,
            project: 'alpha',
            source_path: '/repo/docs/shared.md',
            updated_at: '2026-03-29T08:00:00Z',
          },
          {
            chunk_count: 8,
            project: 'beta',
            source_path: '/repo/docs/shared.md',
            updated_at: '2026-03-30T18:00:00Z',
          },
          {
            chunk_count: 2,
            project: 'beta',
            source_path: '/repo/docs/other.md',
            updated_at: '2026-03-28T10:00:00Z',
          },
        ],
      })
    )

    const { getIngestionSourcesFromCli } = await import('../hyphae/reads-cli.ts')
    await expect(getIngestionSourcesFromCli()).resolves.toEqual([
      {
        chunk_count: 11,
        last_ingested: '2026-03-30T18:00:00Z',
        source_path: '/repo/docs/shared.md',
      },
      {
        chunk_count: 2,
        last_ingested: '2026-03-28T10:00:00Z',
        source_path: '/repo/docs/other.md',
      },
    ])
  })

  it('sorts topic memories by newest-first to preserve the existing Cap contract', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        memories: [
          {
            access_count: 1,
            created_at: '2026-03-29T10:00:00Z',
            id: 'mem_old',
            importance: 'high',
            keywords: [],
            last_accessed: '2026-03-29T10:05:00Z',
            raw_excerpt: null,
            related_ids: [],
            source: { type: 'manual' },
            summary: 'older memory',
            topic: 'decisions/api',
            updated_at: '2026-03-29T10:05:00Z',
            weight: 0.95,
          },
          {
            access_count: 1,
            created_at: '2026-03-30T10:00:00Z',
            id: 'mem_new',
            importance: 'low',
            keywords: [],
            last_accessed: '2026-03-30T10:05:00Z',
            raw_excerpt: null,
            related_ids: [],
            source: { type: 'manual' },
            summary: 'newer memory',
            topic: 'decisions/api',
            updated_at: '2026-03-30T10:05:00Z',
            weight: 0.2,
          },
        ],
      })
    )

    const { getMemoriesByTopicFromCli } = await import('../hyphae/reads-cli.ts')
    const result = await getMemoriesByTopicFromCli('decisions/api', 2)

    expect(runCliMock).toHaveBeenCalledWith([
      '--all-projects',
      'memory',
      'topic',
      'decisions/api',
      '--limit',
      '2',
      '--include-invalidated',
      '--json',
    ])
    expect(result.map((memory) => memory.id)).toEqual(['mem_new', 'mem_old'])
  })
})
