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

describe('Hyphae lessons CLI consumer', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('accepts the owned Hyphae lessons payload', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        lessons: [
          {
            category: 'corrections',
            description: 'Prefer CLI-backed reads',
            frequency: 3,
            id: 'correction-0',
            keywords: ['cli', 'contract'],
            source_topics: ['corrections'],
          },
          {
            category: 'errors',
            description: 'Validate the exported shape',
            frequency: 1,
            id: 'error-1',
            keywords: ['validation'],
            source_topics: ['errors/resolved'],
          },
        ],
        schema_version: '1.0',
      })
    )

    const { getLessons } = await import('../hyphae/lessons.ts')
    await expect(getLessons()).resolves.toEqual([
      {
        category: 'corrections',
        description: 'Prefer CLI-backed reads',
        frequency: 3,
        id: 'correction-0',
        keywords: ['cli', 'contract'],
        source_topics: ['corrections'],
      },
      {
        category: 'errors',
        description: 'Validate the exported shape',
        frequency: 1,
        id: 'error-1',
        keywords: ['validation'],
        source_topics: ['errors/resolved'],
      },
    ])
    expect(runCliMock).toHaveBeenCalledWith(['--all-projects', 'lessons', '--limit', '50'])
  })

  it('rejects malformed lesson payloads', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ lessons: [{ category: 'corrections', frequency: 2 }], schema_version: '1.0' }))

    const { getLessons } = await import('../hyphae/lessons.ts')
    await expect(getLessons()).rejects.toThrow('Hyphae lessons returned an invalid payload')
  })

  it('rejects lesson payloads without a schema version', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        lessons: [
          {
            category: 'corrections',
            description: 'Prefer CLI-backed reads',
            frequency: 3,
            id: 'correction-0',
            keywords: ['cli', 'contract'],
            source_topics: ['corrections'],
          },
        ],
      })
    )

    const { getLessons } = await import('../hyphae/lessons.ts')
    await expect(getLessons()).rejects.toThrow('Hyphae lessons returned an invalid payload')
  })
})
