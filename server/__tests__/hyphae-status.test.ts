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

describe('Hyphae status CLI consumer', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('accepts the owned Hyphae activity snapshot payload', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        schema_version: '1.0',
        snapshot: {
          activity: {
            codex_memory_count: 2,
            last_codex_memory_at: '2026-03-30T18:00:00Z',
            last_session_memory_at: '2026-03-30T18:01:00Z',
            last_session_topic: 'session/end',
            recent_session_memory_count: 2,
          },
          memoirs: 4,
          memories: 12,
        },
      })
    )

    const { getHyphaeStatusSnapshot } = await import('../routes/status/hyphae-cli.ts')
    await expect(getHyphaeStatusSnapshot()).resolves.toEqual({
      activity: {
        codex_memory_count: 2,
        last_codex_memory_at: '2026-03-30T18:00:00Z',
        last_session_memory_at: '2026-03-30T18:01:00Z',
        last_session_topic: 'session/end',
        recent_session_memory_count: 2,
      },
      memoirs: 4,
      memories: 12,
    })
    expect(runCliMock).toHaveBeenCalledWith(['activity'])
  })

  it('rejects malformed activity payloads', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ schema_version: '1.0', snapshot: { activity: {}, memoirs: 4, memories: 12 } }))

    const { getHyphaeStatusSnapshot } = await import('../routes/status/hyphae-cli.ts')
    await expect(getHyphaeStatusSnapshot()).rejects.toThrow('Hyphae activity returned an invalid payload')
  })

  it('rejects activity payloads without a schema version', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        snapshot: {
          activity: {
            codex_memory_count: 2,
            last_codex_memory_at: '2026-03-30T18:00:00Z',
            last_session_memory_at: '2026-03-30T18:01:00Z',
            last_session_topic: 'session/end',
            recent_session_memory_count: 2,
          },
          memoirs: 4,
          memories: 12,
        },
      })
    )

    const { getHyphaeStatusSnapshot } = await import('../routes/status/hyphae-cli.ts')
    await expect(getHyphaeStatusSnapshot()).rejects.toThrow('Hyphae activity returned an invalid payload')
  })
})
