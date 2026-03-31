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

describe('Hyphae gather-context CLI consumer', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('forwards gather-context arguments to the Hyphae CLI and parses the JSON payload', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        context: [{ content: 'Worker A login implementation', relevance: 0.95, source: 'session', topic: 'session/demo' }],
        schema_version: '1.0',
        sources_queried: ['sessions'],
        tokens_budget: 500,
        tokens_used: 12,
      })
    )

    const { gatherContext } = await import('../hyphae/context.ts')
    const result = await gatherContext('login flow', {
      budget: 500,
      include: 'sessions, memories',
      project: 'demo',
      projectRoot: '/repo/demo',
      scope: 'worker-a',
      worktreeId: 'wt-alpha',
    })

    expect(runCliMock).toHaveBeenCalledWith([
      '--project',
      'demo',
      'gather-context',
      '--task',
      'login flow',
      '--token-budget',
      '500',
      '--project-root',
      '/repo/demo',
      '--worktree-id',
      'wt-alpha',
      '--scope',
      'worker-a',
      '--include',
      'sessions',
      '--include',
      'memories',
    ])
    expect(result).toEqual({
      context: [{ content: 'Worker A login implementation', relevance: 0.95, source: 'session', topic: 'session/demo' }],
      sources_queried: ['sessions'],
      tokens_budget: 500,
      tokens_used: 12,
    })
  })

  it('throws when the CLI call fails', async () => {
    runCliMock.mockRejectedValue(new Error('cli unavailable'))

    const { gatherContext } = await import('../hyphae/context.ts')
    await expect(gatherContext('login flow', { budget: 700 })).rejects.toThrow('Failed to load Hyphae gather-context from CLI')
  })

  it('preserves unscoped requests by passing --all-projects when no project is selected', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        context: [],
        schema_version: '1.0',
        sources_queried: ['memories'],
        tokens_budget: 700,
        tokens_used: 0,
      })
    )

    const { gatherContext } = await import('../hyphae/context.ts')
    await gatherContext('login flow', { budget: 700 })

    expect(runCliMock).toHaveBeenCalledWith(['gather-context', '--task', 'login flow', '--token-budget', '700', '--all-projects'])
  })

  it('throws when the CLI returns malformed JSON', async () => {
    runCliMock.mockResolvedValue('not-json')

    const { gatherContext } = await import('../hyphae/context.ts')
    await expect(gatherContext('login flow', { budget: 700 })).rejects.toThrow('Failed to load Hyphae gather-context from CLI')
  })

  it('throws when the CLI omits the schema version', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        context: [],
        sources_queried: ['memories'],
        tokens_budget: 700,
        tokens_used: 0,
      })
    )

    const { gatherContext } = await import('../hyphae/context.ts')
    await expect(gatherContext('login flow', { budget: 700 })).rejects.toThrow('Failed to load Hyphae gather-context from CLI')
  })
})
