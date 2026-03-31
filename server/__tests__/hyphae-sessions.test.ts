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

describe('Hyphae session list CLI consumer', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('forwards project and limit to the Hyphae session list CLI and parses the JSON payload', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        sessions: [
          {
            ended_at: '2026-03-27T12:10:00Z',
            errors: '0',
            files_modified: '["src/page.tsx"]',
            id: 'ses_1',
            project: 'cap',
            project_root: '/repo/cap',
            scope: 'worker-a',
            started_at: '2026-03-27T12:00:00Z',
            status: 'completed',
            summary: 'Wired session list endpoint',
            task: 'build session list',
            worktree_id: 'wt-alpha',
          },
        ],
      })
    )

    const { getSessionListFromCli } = await import('../hyphae/session-list-cli.ts')
    const result = await getSessionListFromCli(
      {
        project: 'cap',
        projectRoot: '/repo/cap',
        scope: 'worker-a',
        worktreeId: 'wt-alpha',
      },
      50
    )

    expect(runCliMock).toHaveBeenCalledWith([
      'session',
      'list',
      '--project',
      'cap',
      '--project-root',
      '/repo/cap',
      '--worktree-id',
      'wt-alpha',
      '--scope',
      'worker-a',
      '--limit',
      '50',
    ])
    expect(result).toEqual([
      expect.objectContaining({
        id: 'ses_1',
        project: 'cap',
        project_root: '/repo/cap',
        worktree_id: 'wt-alpha',
      }),
    ])
  })

  it('keeps recent cross-project sessions unscoped when no project is selected', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        sessions: [
          {
            ended_at: null,
            errors: null,
            files_modified: null,
            id: 'ses_recent',
            project: 'cap',
            project_root: null,
            scope: null,
            started_at: '2026-03-27T12:00:00Z',
            status: 'active',
            summary: null,
            task: 'inspect recent work',
            worktree_id: null,
          },
        ],
      })
    )

    const { getSessionListFromCli } = await import('../hyphae/session-list-cli.ts')
    await getSessionListFromCli({}, 30)

    expect(runCliMock).toHaveBeenCalledWith(['session', 'list', '--all-projects', '--limit', '30'])
  })

  it('throws when the CLI call fails', async () => {
    runCliMock.mockRejectedValue(new Error('cli unavailable'))

    const { getSessionListFromCli } = await import('../hyphae/session-list-cli.ts')
    await expect(getSessionListFromCli({ project: 'cap' }, 20)).rejects.toThrow('Failed to load Hyphae session list from CLI')
  })

  it('throws when the CLI returns malformed JSON', async () => {
    runCliMock.mockResolvedValue('not-json')

    const { getSessionListFromCli } = await import('../hyphae/session-list-cli.ts')
    await expect(getSessionListFromCli({ project: 'cap' }, 20)).rejects.toThrow('Failed to load Hyphae session list from CLI')
  })

  it('throws when the CLI returns a payload that does not match the session contract', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ schema_version: '1.0', sessions: [{ session_id: 'ses_1' }] }))

    const { getSessionListFromCli } = await import('../hyphae/session-list-cli.ts')
    await expect(getSessionListFromCli({ project: 'cap' }, 20)).rejects.toThrow('Failed to load Hyphae session list from CLI')
  })

  it('throws when the CLI returns a partially shaped session record', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        sessions: [
          {
            id: 'ses_1',
            project: 'cap',
            started_at: '2026-03-27T12:00:00Z',
            status: 'completed',
          },
        ],
      })
    )

    const { getSessionListFromCli } = await import('../hyphae/session-list-cli.ts')
    await expect(getSessionListFromCli({ project: 'cap' }, 20)).rejects.toThrow('Failed to load Hyphae session list from CLI')
  })

  it('throws when the CLI omits the schema version', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        sessions: [
          {
            ended_at: null,
            errors: null,
            files_modified: null,
            id: 'ses_recent',
            project: 'cap',
            project_root: null,
            scope: null,
            started_at: '2026-03-27T12:00:00Z',
            status: 'active',
            summary: null,
            task: 'inspect recent work',
            worktree_id: null,
          },
        ],
      })
    )

    const { getSessionListFromCli } = await import('../hyphae/session-list-cli.ts')
    await expect(getSessionListFromCli({ project: 'cap' }, 20)).rejects.toThrow('Failed to load Hyphae session list from CLI')
  })
})
