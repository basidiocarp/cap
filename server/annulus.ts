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

export interface ResolvedStatusSegment {
  id: string
  enabled: boolean
  config?: Record<string, unknown>
}

export interface ResolvedStatusTheme {
  color_mode: 'auto' | 'always' | 'never'
  separator: string
}

export interface ResolvedStatusMetadata {
  created_at?: string
  version?: string
  preset_name?: string | null
}

export interface ResolvedStatusHostOverride {
  theme?: ResolvedStatusTheme
  segments?: ResolvedStatusSegment[]
}

export interface ResolvedStatusCustomization {
  schema_version: '1.0'
  segments: ResolvedStatusSegment[]
  theme: ResolvedStatusTheme
  host_overrides?: {
    claude_code?: ResolvedStatusHostOverride
    codex?: ResolvedStatusHostOverride
    cursor?: ResolvedStatusHostOverride
  }
  metadata?: ResolvedStatusMetadata
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
  if (payload.schema !== 'annulus-status-v1') {
    throw new Error(`annulus status --json schema mismatch: expected annulus-status-v1, got ${payload.schema}`)
  }
  if (payload.version !== '1') {
    throw new Error(`annulus status --json version mismatch: expected "1", got ${payload.version}`)
  }
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

function parseSegment(raw: unknown): ResolvedStatusSegment | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const s = raw as Record<string, unknown>
  if (typeof s.id !== 'string' || typeof s.enabled !== 'boolean') return null
  const config =
    s.config && typeof s.config === 'object' && !Array.isArray(s.config)
      ? (s.config as Record<string, unknown>)
      : undefined
  return { config, enabled: s.enabled, id: s.id }
}

function parseConfigExportOutput(stdout: string): ResolvedStatusCustomization {
  let parsed: unknown
  try {
    parsed = JSON.parse(stdout)
  } catch {
    throw new Error('annulus config export returned non-JSON output')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('annulus config export returned unexpected shape')
  }

  const payload = parsed as Record<string, unknown>
  if (payload.schema_version !== '1.0') {
    throw new Error(`config export schema_version mismatch: expected "1.0", got ${payload.schema_version}`)
  }

  if (!Array.isArray(payload.segments)) {
    throw new Error('config export missing segments array')
  }
  const segments = payload.segments.flatMap((s) => {
    const seg = parseSegment(s)
    return seg ? [seg] : []
  })

  const themeRaw = payload.theme
  if (!themeRaw || typeof themeRaw !== 'object' || Array.isArray(themeRaw)) {
    throw new Error('config export missing or invalid theme')
  }
  const t = themeRaw as Record<string, unknown>
  if (typeof t.separator !== 'string') {
    throw new Error('config export theme missing separator')
  }
  const validColorModes = new Set(['auto', 'always', 'never'])
  if (typeof t.color_mode !== 'string' || !validColorModes.has(t.color_mode)) {
    throw new Error(`config export theme.color_mode invalid: ${t.color_mode}`)
  }
  const theme: ResolvedStatusTheme = {
    color_mode: t.color_mode as 'auto' | 'always' | 'never',
    separator: t.separator,
  }

  const metaRaw = payload.metadata
  let metadata: ResolvedStatusMetadata | undefined
  if (metaRaw && typeof metaRaw === 'object' && !Array.isArray(metaRaw)) {
    const m = metaRaw as Record<string, unknown>
    metadata = {
      created_at: typeof m.created_at === 'string' ? m.created_at : undefined,
      preset_name:
        m.preset_name === null ? null : typeof m.preset_name === 'string' ? m.preset_name : undefined,
      version: typeof m.version === 'string' ? m.version : undefined,
    }
  }

  return { metadata, schema_version: '1.0', segments, theme }
}

export async function getAnnulusConfigExport(): Promise<ResolvedStatusCustomization | null> {
  try {
    const stdout = await run(['config', 'export'])
    return parseConfigExportOutput(stdout)
  } catch (err) {
    logger.debug({ err }, 'annulus config export not available or returned an error')
    return null
  }
}
