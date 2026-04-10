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

describe('Hyphae session timeline detail CLI consumer', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('forwards the session id and normalizes the CLI payload into timeline events', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        timeline: [
          {
            events: [
              {
                detail: 'session attribution bridge',
                id: 'rec_1',
                kind: 'recall',
                memory_count: 3,
                occurred_at: '2026-03-27T12:02:00Z',
                recall_event_id: 'rec_1',
                signal_type: null,
                signal_value: null,
                source: null,
                title: 'Recalled 3 memories',
              },
              {
                detail: 'Build passed',
                id: 'out_1',
                kind: 'outcome',
                memory_count: null,
                occurred_at: '2026-03-27T12:10:00Z',
                recall_event_id: null,
                signal_type: 'test_passed',
                signal_value: 1,
                source: 'session_end',
                title: 'Session summary',
              },
            ],
            id: 'ses_123',
            project: 'cap',
          },
        ],
      })
    )

    const { getSessionTimelineEventsFromCli } = await import('../hyphae/session-timeline-detail-cli.ts')
    const result = await getSessionTimelineEventsFromCli('ses_123')

    expect(runCliMock).toHaveBeenCalledWith(['session', 'timeline', '--session-id', 'ses_123', '--format', 'json'])
    expect(result).toEqual([
      {
        content: 'Recalled 3 memories: session attribution bridge',
        timestamp: '2026-03-27T12:02:00Z',
        type: 'recall',
      },
      {
        content: 'Session summary: Build passed',
        score: 1,
        timestamp: '2026-03-27T12:10:00Z',
        type: 'test_pass',
      },
    ])
  })

  it('returns an empty array when the session has no events', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        timeline: [
          {
            events: [],
            id: 'ses_empty',
            project: 'cap',
          },
        ],
      })
    )

    const { getSessionTimelineEventsFromCli } = await import('../hyphae/session-timeline-detail-cli.ts')
    await expect(getSessionTimelineEventsFromCli('ses_empty')).resolves.toEqual([])
  })

  it('throws when the requested session is missing from the payload', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        timeline: [
          {
            events: [],
            id: 'ses_other',
            project: 'cap',
          },
        ],
      })
    )

    const { getSessionTimelineEventsFromCli } = await import('../hyphae/session-timeline-detail-cli.ts')
    await expect(getSessionTimelineEventsFromCli('ses_missing')).rejects.toMatchObject({ kind: 'not_found' })
  })
})
