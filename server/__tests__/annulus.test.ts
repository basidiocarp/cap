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

// This tests the `annulus status --json` output shape.
// The septa `annulus-statusline-v1` schema covers the separate `annulus statusline --json` surface
// used by the statusline hook, not this route.
describe('annulus status --json output shape', () => {
  beforeEach(() => {
    vi.resetModules()
    runCliMock.mockReset()
  })

  it('parses the full real-world status output shape with schema and version fields', async () => {
    // Fixture reflecting the real `annulus status --json` output shape:
    // top-level object with schema, version, and reports array.
    const fixture = {
      reports: [
        { available: true, degraded_capabilities: [], tier: 'tier1' as const, tool: 'mycelium' },
        { available: true, degraded_capabilities: [], tier: 'tier1' as const, tool: 'hyphae' },
        { available: false, degraded_capabilities: ['impact'], tier: 'tier2' as const, tool: 'rhizome' },
        { available: true, degraded_capabilities: ['statusline'], tier: 'tier3' as const, tool: 'annulus' },
      ],
      schema: 'annulus-status-v1',
      version: '1',
    }

    runCliMock.mockResolvedValue(JSON.stringify(fixture))

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result.available).toBe(true)
    expect(result.reports).toHaveLength(4)
    expect(result.reports[0]).toEqual({ available: true, degraded_capabilities: [], tier: 'tier1', tool: 'mycelium' })
    expect(result.reports[1]).toEqual({ available: true, degraded_capabilities: [], tier: 'tier1', tool: 'hyphae' })
    expect(result.reports[2]).toEqual({ available: false, degraded_capabilities: ['impact'], tier: 'tier2', tool: 'rhizome' })
    expect(result.reports[3]).toEqual({ available: true, degraded_capabilities: ['statusline'], tier: 'tier3', tool: 'annulus' })
  })

  it('returns available:true even when some reports are unavailable', async () => {
    const fixture = {
      reports: [
        { available: false, degraded_capabilities: ['search', 'recall'], tier: 'tier1' as const, tool: 'hyphae' },
        { available: false, degraded_capabilities: [], tier: 'tier2' as const, tool: 'rhizome' },
      ],
      schema: 'annulus-status-v1',
      version: '1',
    }

    runCliMock.mockResolvedValue(JSON.stringify(fixture))

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    // available:true means the annulus CLI itself responded; individual tool
    // availability is carried in each report's own available field.
    expect(result.available).toBe(true)
    expect(result.reports).toHaveLength(2)
    expect(result.reports[0].available).toBe(false)
    expect(result.reports[0].degraded_capabilities).toEqual(['search', 'recall'])
  })

  it('returns available:false when reports field is missing', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ schema: 'annulus-status-v1', version: '1' }))

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result).toEqual({ available: false, reports: [] })
  })

  it('accepts all three tier values in report entries', async () => {
    const fixture = {
      reports: [
        { available: true, degraded_capabilities: [], tier: 'tier1' as const, tool: 'a' },
        { available: true, degraded_capabilities: [], tier: 'tier2' as const, tool: 'b' },
        { available: true, degraded_capabilities: [], tier: 'tier3' as const, tool: 'c' },
      ],
      schema: 'annulus-status-v1',
      version: '1',
    }

    runCliMock.mockResolvedValue(JSON.stringify(fixture))

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result.reports.map((r) => r.tier)).toEqual(['tier1', 'tier2', 'tier3'])
  })

  it('returns available:false when schema is wrong', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        reports: [{ available: true, degraded_capabilities: [], tier: 'tier1', tool: 'mycelium' }],
        schema: 'wrong-schema-name',
        version: '1',
      })
    )

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result).toEqual({ available: false, reports: [] })
  })

  it('returns available:false when schema is missing', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        reports: [{ available: true, degraded_capabilities: [], tier: 'tier1', tool: 'mycelium' }],
        version: '1',
      })
    )

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result).toEqual({ available: false, reports: [] })
  })

  it('returns available:false when version is wrong', async () => {
    runCliMock.mockResolvedValue(
      JSON.stringify({
        reports: [{ available: true, degraded_capabilities: [], tier: 'tier1', tool: 'mycelium' }],
        schema: 'annulus-status-v1',
        version: '2',
      })
    )

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result).toEqual({ available: false, reports: [] })
  })

  it('accepts empty reports array', async () => {
    runCliMock.mockResolvedValue(JSON.stringify({ reports: [], schema: 'annulus-status-v1', version: '1' }))

    const { getAnnulusStatus } = await import('../annulus.ts')
    const result = await getAnnulusStatus()

    expect(result).toEqual({ available: true, reports: [] })
  })
})
