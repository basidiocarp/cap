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

describe('Hyphae session timeline CLI consumer', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('forwards project and limit to the Hyphae session timeline CLI and parses the JSON payload', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        timeline: [
          {
            ended_at: '2026-03-27T12:10:00Z',
            errors: '0',
            events: [],
            files_modified: '["src/page.tsx"]',
            id: 'ses_1',
            last_activity_at: '2026-03-27T12:10:00Z',
            outcome_count: 0,
            project: 'cap',
            project_root: '/repo/cap',
            recall_count: 1,
            scope: 'worker-a',
            started_at: '2026-03-27T12:00:00Z',
            status: 'completed',
            summary: 'Wired timeline endpoint',
            task: 'build session timeline',
            worktree_id: 'wt-alpha',
          },
        ],
      })
    )

    const { getSessionTimelineFromCli } = await import('../hyphae/session-timeline-cli.ts')
    const result = await getSessionTimelineFromCli(
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
      'timeline',
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
        last_activity_at: '2026-03-27T12:10:00Z',
        project: 'cap',
        project_root: '/repo/cap',
        worktree_id: 'wt-alpha',
      }),
    ])
  })

  it('throws when the CLI call fails', async () => {
    runCliMock.mockRejectedValue(new Error('cli unavailable'))

    const { getSessionTimelineFromCli } = await import('../hyphae/session-timeline-cli.ts')
    await expect(getSessionTimelineFromCli({ project: 'cap' }, 20)).rejects.toThrow('Failed to load Hyphae session timeline from CLI')
  })

  it('keeps recent cross-project timelines unscoped when no project is selected', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        timeline: [
          {
            ended_at: null,
            errors: null,
            events: [],
            files_modified: null,
            id: 'ses_recent',
            last_activity_at: '2026-03-27T12:10:00Z',
            outcome_count: 0,
            project: 'cap',
            project_root: null,
            recall_count: 0,
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

    const { getSessionTimelineFromCli } = await import('../hyphae/session-timeline-cli.ts')
    await getSessionTimelineFromCli({}, 30)

    expect(runCliMock).toHaveBeenCalledWith(['session', 'timeline', '--all-projects', '--limit', '30'])
  })

  it('throws when the CLI returns malformed JSON', async () => {
    runCliMock.mockResolvedValue('not-json')

    const { getSessionTimelineFromCli } = await import('../hyphae/session-timeline-cli.ts')
    await expect(getSessionTimelineFromCli({ project: 'cap' }, 20)).rejects.toThrow('Failed to load Hyphae session timeline from CLI')
  })

  it('throws when the CLI returns a payload that does not match the timeline contract', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ schema_version: '1.0', timeline: [{ id: 'ses_1', project: 'cap' }] }))

    const { getSessionTimelineFromCli } = await import('../hyphae/session-timeline-cli.ts')
    await expect(getSessionTimelineFromCli({ project: 'cap' }, 20)).rejects.toThrow('Failed to load Hyphae session timeline from CLI')
  })

  it('throws when the CLI returns malformed nested timeline events', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        timeline: [
          {
            ended_at: '2026-03-27T12:10:00Z',
            errors: '0',
            events: [{ id: 'evt_1', kind: 'recall' }],
            files_modified: '["src/page.tsx"]',
            id: 'ses_1',
            last_activity_at: '2026-03-27T12:10:00Z',
            outcome_count: 0,
            project: 'cap',
            project_root: '/repo/cap',
            recall_count: 1,
            scope: 'worker-a',
            started_at: '2026-03-27T12:00:00Z',
            status: 'completed',
            summary: 'Wired timeline endpoint',
            task: 'build session timeline',
            worktree_id: 'wt-alpha',
          },
        ],
      })
    )

    const { getSessionTimelineFromCli } = await import('../hyphae/session-timeline-cli.ts')
    await expect(getSessionTimelineFromCli({ project: 'cap' }, 20)).rejects.toThrow('Failed to load Hyphae session timeline from CLI')
  })

  it('throws when the CLI omits the schema version', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        timeline: [
          {
            ended_at: null,
            errors: null,
            events: [],
            files_modified: null,
            id: 'ses_recent',
            last_activity_at: '2026-03-27T12:10:00Z',
            outcome_count: 0,
            project: 'cap',
            project_root: null,
            recall_count: 0,
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

    const { getSessionTimelineFromCli } = await import('../hyphae/session-timeline-cli.ts')
    await expect(getSessionTimelineFromCli({ project: 'cap' }, 20)).rejects.toThrow('Failed to load Hyphae session timeline from CLI')
  })
})
