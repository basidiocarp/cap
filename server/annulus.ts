import { createCliRunner } from './lib/cli.ts'
import { ANNULUS_BIN } from './lib/config.ts'
import { logger } from './logger.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AnnulusToolReport {
  tool: string
  available: boolean
  tier: 'tier1' | 'tier2' | 'tier3'
  degraded_capabilities: string[]
}

export interface AnnulusStatusPayload {
  schema: string
  version: string
  reports: AnnulusToolReport[]
}

export interface AnnulusStatusResult {
  available: boolean
  reports: AnnulusToolReport[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────────────────────────────────────

function isValidTier(tier: unknown): tier is 'tier1' | 'tier2' | 'tier3' {
  return tier === 'tier1' || tier === 'tier2' || tier === 'tier3'
}

function parseReport(raw: unknown): AnnulusToolReport | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (typeof r.tool !== 'string' || typeof r.available !== 'boolean' || !isValidTier(r.tier)) return null
  const degraded = Array.isArray(r.degraded_capabilities) ? r.degraded_capabilities.filter((x): x is string => typeof x === 'string') : []
  return { available: r.available, degraded_capabilities: degraded, tier: r.tier, tool: r.tool }
}

function parseAnnulusOutput(stdout: string): AnnulusStatusResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(stdout)
  } catch {
    throw new Error('annulus status --json returned non-JSON output')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('annulus status --json returned unexpected shape')
  }

  const payload = parsed as Record<string, unknown>
  if (!Array.isArray(payload.reports)) {
    throw new Error('annulus status --json missing reports array')
  }

  const reports = payload.reports.flatMap((r) => {
    const report = parseReport(r)
    return report ? [report] : []
  })

  return { available: true, reports }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI runner
// ─────────────────────────────────────────────────────────────────────────────

const run = createCliRunner(ANNULUS_BIN, 'annulus')

export async function getAnnulusStatus(): Promise<AnnulusStatusResult> {
  try {
    const stdout = await run(['status', '--json'])
    return parseAnnulusOutput(stdout)
  } catch (err) {
    logger.debug({ err }, 'annulus not available or returned an error')
    return { available: false, reports: [] }
  }
}
