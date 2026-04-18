import { beforeEach, describe, expect, it, vi } from 'vitest'

const runCliMock = vi.fn()

vi.mock('../lib/cli.ts', () => ({
  createCliRunner: vi.fn(() => runCliMock),
}))

vi.mock('../lib/config.ts', () => ({
  ANNULUS_BIN: 'annulus',
}))

vi.mock('../logger.ts', () => ({
  logger: { debug: vi.fn() },
}))

describe('getAnnulusStatus', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('returns available with parsed reports on valid output', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        reports: [
          { available: true, degraded_capabilities: [], tier: 'tier1', tool: 'mycelium' },
          { available: false, degraded_capabilities: ['memory'], tier: 'tier2', tool: 'hyphae' },
        ],
        schema: 'annulus-status-v1',
        version: '1',
      })
    )

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result.available).toBe(true)
    expect(result.reports).toHaveLength(2)
    expect(result.reports[0]).toMatchObject({ available: true, tier: 'tier1', tool: 'mycelium' })
    expect(result.reports[1]).toMatchObject({ available: false, tier: 'tier2', tool: 'hyphae' })
  })

  it('returns available: false when CLI throws', async () => {
    runCliMock.mockRejectedValue(new Error('command not found: annulus'))

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result).toEqual({ available: false, reports: [] })
  })

  it('returns available: false when output is not JSON', async () => {
    runCliMock.mockResolvedValue('not json')

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result).toEqual({ available: false, reports: [] })
  })

  it('skips malformed report entries but keeps valid ones', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        reports: [{ available: true, degraded_capabilities: [], tier: 'tier1', tool: 'mycelium' }, { bad: 'entry' }, null, 42],
        schema: 'annulus-status-v1',
        version: '1',
      })
    )

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result.available).toBe(true)
    expect(result.reports).toHaveLength(1)
    expect(result.reports[0].tool).toBe('mycelium')
  })

  it('filters non-string entries from degraded_capabilities', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        reports: [{ available: true, degraded_capabilities: ['memory', 42, null, 'search'], tier: 'tier1', tool: 'hyphae' }],
        schema: 'annulus-status-v1',
        version: '1',
      })
    )

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result.reports[0].degraded_capabilities).toEqual(['memory', 'search'])
  })
})
