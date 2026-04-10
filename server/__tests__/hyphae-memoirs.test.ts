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

describe('Hyphae memoir CLI consumer', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('preserves the existing substring filter and ordering contract for memoir detail', async () => {
    runCliMock
      .mockResolvedValueOnce(
        JSON.stringify({
          concepts: [
            {
              confidence: 0.4,
              created_at: '2026-03-24T00:00:00Z',
              definition: 'Contains router context',
              id: 'concept-1',
              labels: [{ namespace: 'kind', value: 'function' }],
              memoir_id: 'memoir-1',
              name: 'alpha_router',
              revision: 1,
              source_memory_ids: ['mem-1'],
              updated_at: '2026-03-24T00:00:00Z',
            },
            {
              confidence: 0.95,
              created_at: '2026-03-24T00:00:00Z',
              definition: 'No keyword here',
              id: 'concept-2',
              labels: [{ namespace: 'kind', value: 'module' }],
              memoir_id: 'memoir-1',
              name: 'beta',
              revision: 2,
              source_memory_ids: [],
              updated_at: '2026-03-24T00:00:00Z',
            },
          ],
          limit: 500,
          memoir: {
            consolidation_threshold: 50,
            created_at: '2026-03-24T00:00:00Z',
            description: 'Memoir description',
            id: 'memoir-1',
            name: 'code:williamnewton',
            updated_at: '2026-03-24T00:00:00Z',
          },
          offset: 0,
          query: null,
          schema_version: '1.0',
          stats: {
            avg_confidence: 0.68,
            label_counts: [{ count: 1, label: 'function' }],
            total_concepts: 3,
            total_links: 4,
          },
          total: 3,
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          concepts: [
            {
              confidence: 0.9,
              created_at: '2026-03-24T00:00:00Z',
              definition: 'Router task helper',
              id: 'concept-3',
              labels: [{ namespace: 'kind', value: 'function' }],
              memoir_id: 'memoir-1',
              name: 'gamma',
              revision: 3,
              source_memory_ids: ['mem-2', 'mem-3'],
              updated_at: '2026-03-24T00:00:00Z',
            },
          ],
          limit: 500,
          memoir: {
            consolidation_threshold: 50,
            created_at: '2026-03-24T00:00:00Z',
            description: 'Memoir description',
            id: 'memoir-1',
            name: 'code:williamnewton',
            updated_at: '2026-03-24T00:00:00Z',
          },
          offset: 2,
          query: null,
          schema_version: '1.0',
          stats: {
            avg_confidence: 0.68,
            label_counts: [{ count: 1, label: 'function' }],
            total_concepts: 3,
            total_links: 4,
          },
          total: 3,
        })
      )

    const { memoirShow } = await import('../hyphae/memoirs-cli.ts')
    const result = await memoirShow('code:williamnewton', { limit: 2, offset: 0, q: 'router' })

    expect(runCliMock).toHaveBeenNthCalledWith(1, ['memoir', 'show', 'code:williamnewton', '--json', '--limit', '500', '--offset', '0'])
    expect(runCliMock).toHaveBeenNthCalledWith(2, ['memoir', 'show', 'code:williamnewton', '--json', '--limit', '500', '--offset', '2'])
    expect(result).toEqual({
      concepts: [
        {
          confidence: 0.9,
          created_at: '2026-03-24T00:00:00Z',
          definition: 'Router task helper',
          id: 'concept-3',
          labels: '[{"namespace":"kind","value":"function"}]',
          memoir_id: 'memoir-1',
          name: 'gamma',
          revision: 3,
          source_memory_ids: '["mem-2","mem-3"]',
          updated_at: '2026-03-24T00:00:00Z',
        },
        {
          confidence: 0.4,
          created_at: '2026-03-24T00:00:00Z',
          definition: 'Contains router context',
          id: 'concept-1',
          labels: '[{"namespace":"kind","value":"function"}]',
          memoir_id: 'memoir-1',
          name: 'alpha_router',
          revision: 1,
          source_memory_ids: '["mem-1"]',
          updated_at: '2026-03-24T00:00:00Z',
        },
      ],
      limit: 2,
      memoir: {
        consolidation_threshold: 50,
        created_at: '2026-03-24T00:00:00Z',
        description: 'Memoir description',
        id: 'memoir-1',
        name: 'code:williamnewton',
        updated_at: '2026-03-24T00:00:00Z',
      },
      offset: 0,
      query: 'router',
      total_concepts: 2,
    })
  })

  it('sorts memoir lists by updated_at descending to preserve the existing Cap sidebar order', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        memoirs: [
          {
            concept_count: 1,
            link_count: 0,
            memoir: {
              consolidation_threshold: 50,
              created_at: '2026-03-20T00:00:00Z',
              description: 'Older memoir',
              id: 'memoir-older',
              name: 'alpha',
              updated_at: '2026-03-20T00:00:00Z',
            },
          },
          {
            concept_count: 2,
            link_count: 1,
            memoir: {
              consolidation_threshold: 50,
              created_at: '2026-03-25T00:00:00Z',
              description: 'Newer memoir',
              id: 'memoir-newer',
              name: 'zeta',
              updated_at: '2026-03-25T00:00:00Z',
            },
          },
        ],
        schema_version: '1.0',
      })
    )

    const { memoirList } = await import('../hyphae/memoirs-cli.ts')
    const result = await memoirList()

    expect(runCliMock).toHaveBeenCalledWith(['memoir', 'list', '--json'])
    expect(result.map((memoir) => memoir.id)).toEqual(['memoir-newer', 'memoir-older'])
  })

  it('returns null when the memoir show CLI reports memoir not found', async () => {
    runCliMock.mockRejectedValue(new Error('memoir not found: code:missing'))

    const { memoirShow } = await import('../hyphae/memoirs-cli.ts')
    await expect(memoirShow('code:missing')).resolves.toBeNull()
  })

  it('returns inspect neighbors in the legacy Cap shape', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        concept: {
          confidence: 0.9,
          created_at: '2026-03-24T00:00:00Z',
          definition: 'Collect request context',
          id: 'concept-root',
          labels: [{ namespace: 'kind', value: 'function' }],
          memoir_id: 'memoir-1',
          name: 'gather_context',
          revision: 1,
          source_memory_ids: [],
          updated_at: '2026-03-24T00:00:00Z',
        },
        depth: 2,
        memoir: {
          consolidation_threshold: 50,
          created_at: '2026-03-24T00:00:00Z',
          description: 'Memoir description',
          id: 'memoir-1',
          name: 'code:williamnewton',
          updated_at: '2026-03-24T00:00:00Z',
        },
        neighborhood: {
          concepts: [
            {
              confidence: 0.82,
              created_at: '2026-03-24T00:00:00Z',
              definition: 'Loads sessions',
              id: 'concept-a',
              labels: [{ namespace: 'kind', value: 'function' }],
              memoir_id: 'memoir-1',
              name: 'session_list',
              revision: 1,
              source_memory_ids: [],
              updated_at: '2026-03-24T00:00:00Z',
            },
            {
              confidence: 0.8,
              created_at: '2026-03-24T00:00:00Z',
              definition: 'Builds timeline',
              id: 'concept-b',
              labels: [{ namespace: 'kind', value: 'function' }],
              memoir_id: 'memoir-1',
              name: 'timeline',
              revision: 1,
              source_memory_ids: [],
              updated_at: '2026-03-24T00:00:00Z',
            },
          ],
          links: [
            {
              created_at: '2026-03-24T00:00:00Z',
              id: 'link-1',
              relation: 'calls',
              source_id: 'concept-root',
              target_id: 'concept-a',
              weight: 0.7,
            },
            {
              created_at: '2026-03-24T00:00:00Z',
              id: 'link-2',
              relation: 'calls',
              source_id: 'concept-a',
              target_id: 'concept-b',
              weight: 0.5,
            },
          ],
        },
        schema_version: '1.0',
      })
    )

    const { memoirInspect } = await import('../hyphae/memoirs-cli.ts')
    const result = await memoirInspect('code:williamnewton', 'gather_context', 2)

    expect(runCliMock).toHaveBeenCalledWith([
      'memoir',
      'inspect',
      'code:williamnewton',
      '--concept',
      'gather_context',
      '--depth',
      '2',
      '--json',
    ])
    expect(result).toEqual({
      concept: {
        confidence: 0.9,
        created_at: '2026-03-24T00:00:00Z',
        definition: 'Collect request context',
        id: 'concept-root',
        labels: '[{"namespace":"kind","value":"function"}]',
        memoir_id: 'memoir-1',
        name: 'gather_context',
        revision: 1,
        source_memory_ids: '[]',
        updated_at: '2026-03-24T00:00:00Z',
      },
      neighbors: [
        {
          concept: {
            confidence: 0.82,
            created_at: '2026-03-24T00:00:00Z',
            definition: 'Loads sessions',
            id: 'concept-a',
            labels: '[{"namespace":"kind","value":"function"}]',
            memoir_id: 'memoir-1',
            name: 'session_list',
            revision: 1,
            source_memory_ids: '[]',
            updated_at: '2026-03-24T00:00:00Z',
          },
          direction: 'outgoing',
          link: {
            created_at: '2026-03-24T00:00:00Z',
            id: 'link-1',
            relation: 'calls',
            source_id: 'concept-root',
            target_id: 'concept-a',
            weight: 0.7,
          },
        },
        {
          concept: {
            confidence: 0.8,
            created_at: '2026-03-24T00:00:00Z',
            definition: 'Builds timeline',
            id: 'concept-b',
            labels: '[{"namespace":"kind","value":"function"}]',
            memoir_id: 'memoir-1',
            name: 'timeline',
            revision: 1,
            source_memory_ids: '[]',
            updated_at: '2026-03-24T00:00:00Z',
          },
          direction: 'outgoing',
          link: {
            created_at: '2026-03-24T00:00:00Z',
            id: 'link-2',
            relation: 'calls',
            source_id: 'concept-a',
            target_id: 'concept-b',
            weight: 0.5,
          },
        },
      ],
    })
  })

  it('returns null when the memoir inspect CLI reports concept not found', async () => {
    runCliMock.mockRejectedValue(new Error('concept not found: missing'))

    const { memoirInspect } = await import('../hyphae/memoirs-cli.ts')
    await expect(memoirInspect('code:williamnewton', 'missing')).resolves.toBeNull()
  })

  it('throws when memoir search-all returns a payload that does not match the contract', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ results: [{ id: 'concept-1' }], schema_version: '1.0' }))

    const { memoirSearchAll } = await import('../hyphae/memoirs-cli.ts')
    await expect(memoirSearchAll('context')).rejects.toThrow('Hyphae memoir search-all returned an invalid payload')
  })

  it('rejects memoir list payloads that omit the schema version', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ memoirs: [] }))

    const { memoirList } = await import('../hyphae/memoirs-cli.ts')
    await expect(memoirList()).rejects.toThrow('Hyphae memoir list returned an invalid payload')
  })

  it('pages through memoir search results so Cap keeps the full result set', async () => {
    runCliMock
      .mockResolvedValueOnce(
        JSON.stringify({
          limit: 500,
          memoir: {
            consolidation_threshold: 50,
            created_at: '2026-03-24T00:00:00Z',
            description: 'Memoir description',
            id: 'memoir-1',
            name: 'code:williamnewton',
            updated_at: '2026-03-24T00:00:00Z',
          },
          offset: 0,
          query: 'context',
          results: [
            {
              confidence: 0.9,
              created_at: '2026-03-24T00:00:00Z',
              definition: 'First result',
              id: 'concept-1',
              labels: [{ namespace: 'kind', value: 'function' }],
              memoir_id: 'memoir-1',
              name: 'alpha',
              revision: 1,
              source_memory_ids: [],
              updated_at: '2026-03-24T00:00:00Z',
            },
          ],
          schema_version: '1.0',
          total: 2,
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          limit: 500,
          memoir: {
            consolidation_threshold: 50,
            created_at: '2026-03-24T00:00:00Z',
            description: 'Memoir description',
            id: 'memoir-1',
            name: 'code:williamnewton',
            updated_at: '2026-03-24T00:00:00Z',
          },
          offset: 1,
          query: 'context',
          results: [
            {
              confidence: 0.8,
              created_at: '2026-03-24T00:00:00Z',
              definition: 'Second result',
              id: 'concept-2',
              labels: [{ namespace: 'kind', value: 'module' }],
              memoir_id: 'memoir-1',
              name: 'beta',
              revision: 1,
              source_memory_ids: ['mem-1'],
              updated_at: '2026-03-24T00:00:00Z',
            },
          ],
          schema_version: '1.0',
          total: 2,
        })
      )

    const { memoirSearch } = await import('../hyphae/memoirs-cli.ts')
    const result = await memoirSearch('code:williamnewton', 'context')

    expect(runCliMock).toHaveBeenNthCalledWith(1, [
      'memoir',
      'search',
      'context',
      '--memoir',
      'code:williamnewton',
      '--limit',
      '500',
      '--offset',
      '0',
      '--json',
    ])
    expect(runCliMock).toHaveBeenNthCalledWith(2, [
      'memoir',
      'search',
      'context',
      '--memoir',
      'code:williamnewton',
      '--limit',
      '500',
      '--offset',
      '1',
      '--json',
    ])
    expect(result.map((concept) => concept.id)).toEqual(['concept-1', 'concept-2'])
  })

  it('pages through cross-memoir search results so Cap does not silently truncate at 200', async () => {
    runCliMock
      .mockResolvedValueOnce(
        JSON.stringify({
          limit: 500,
          offset: 0,
          query: 'context',
          results: [
            {
              concept: {
                confidence: 0.9,
                created_at: '2026-03-24T00:00:00Z',
                definition: 'First result',
                id: 'concept-1',
                labels: [{ namespace: 'kind', value: 'function' }],
                memoir_id: 'memoir-1',
                name: 'alpha',
                revision: 1,
                source_memory_ids: [],
                updated_at: '2026-03-24T00:00:00Z',
              },
              memoir: {
                consolidation_threshold: 50,
                created_at: '2026-03-24T00:00:00Z',
                description: 'Memoir A',
                id: 'memoir-1',
                name: 'alpha',
                updated_at: '2026-03-24T00:00:00Z',
              },
            },
          ],
          schema_version: '1.0',
          total: 2,
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          limit: 500,
          offset: 1,
          query: 'context',
          results: [
            {
              concept: {
                confidence: 0.8,
                created_at: '2026-03-24T00:00:00Z',
                definition: 'Second result',
                id: 'concept-2',
                labels: [{ namespace: 'kind', value: 'module' }],
                memoir_id: 'memoir-2',
                name: 'beta',
                revision: 1,
                source_memory_ids: ['mem-1'],
                updated_at: '2026-03-24T00:00:00Z',
              },
              memoir: {
                consolidation_threshold: 50,
                created_at: '2026-03-24T00:00:00Z',
                description: 'Memoir B',
                id: 'memoir-2',
                name: 'beta',
                updated_at: '2026-03-24T00:00:00Z',
              },
            },
          ],
          schema_version: '1.0',
          total: 2,
        })
      )

    const { memoirSearchAll } = await import('../hyphae/memoirs-cli.ts')
    const result = await memoirSearchAll('context')

    expect(runCliMock).toHaveBeenNthCalledWith(1, ['memoir', 'search-all', 'context', '--limit', '500', '--offset', '0', '--json'])
    expect(runCliMock).toHaveBeenNthCalledWith(2, ['memoir', 'search-all', 'context', '--limit', '500', '--offset', '1', '--json'])
    expect(result.map((concept) => concept.id)).toEqual(['concept-1', 'concept-2'])
  })
})
