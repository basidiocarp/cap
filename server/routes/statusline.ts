import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { Hono } from 'hono'

import { logger } from '../logger.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_SEGMENT_NAMES = new Set([
  'context',
  'usage',
  'cost',
  'model',
  'savings',
  'degradation',
  'branch',
  'workspace',
  'context-bar',
  'context-metrics',
  'hyphae',
  'heartbeat',
  'bridge',
  'canopy-adoption',
  'canopy-notifications',
  'cortina',
])

const DEFAULT_SEGMENTS: StatuslineSegment[] = [
  { color: null, enabled: true, line: 1, name: 'context', separator: null },
  { color: null, enabled: true, line: 1, name: 'usage', separator: null },
  { color: null, enabled: true, line: 1, name: 'cost', separator: null },
  { color: null, enabled: true, line: 1, name: 'model', separator: null },
  { color: null, enabled: true, line: 1, name: 'savings', separator: null },
  { color: null, enabled: false, line: 1, name: 'degradation', separator: null },
  { color: null, enabled: true, line: 1, name: 'branch', separator: null },
  { color: null, enabled: true, line: 1, name: 'workspace', separator: null },
  { color: null, enabled: true, line: 1, name: 'context-bar', separator: null },
  { color: null, enabled: false, line: 1, name: 'context-metrics', separator: null },
  { color: null, enabled: true, line: 1, name: 'hyphae', separator: null },
  { color: null, enabled: true, line: 1, name: 'heartbeat', separator: null },
]

// Annulus SeparatorStyle enum variants (lowercase serde names)
const SEPARATOR_TOML_TO_DISPLAY: Record<string, string> = {
  pipe: ' │ ',
  space: '  ',
  none: '',
}
const SEPARATOR_DISPLAY_TO_TOML: Record<string, string> = {
  ' │ ': 'pipe',
  '  ': 'space',
  '': 'none',
}

// Display string shown in the UI and used for preview rendering
const DEFAULT_SEPARATOR_DISPLAY = ' │ '
// Enum name written to TOML (annulus SeparatorStyle serde variant)
const DEFAULT_SEPARATOR_TOML = 'pipe'

function tomlSeparatorToDisplay(tomlValue: string): string {
  return SEPARATOR_TOML_TO_DISPLAY[tomlValue] ?? DEFAULT_SEPARATOR_DISPLAY
}

function displaySeparatorToToml(display: string): string {
  return SEPARATOR_DISPLAY_TO_TOML[display] ?? DEFAULT_SEPARATOR_TOML
}

/** Escape a string for use inside a TOML double-quoted string. */
function escapeTomlString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StatuslineSegment {
  name: string
  enabled: boolean
  color: string | null
  separator: string | null
  line: 1 | 2
}

export interface StatuslineConfig {
  segments: StatuslineSegment[]
  separator: string
  config_path: string
  exists: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// TOML helpers
// ─────────────────────────────────────────────────────────────────────────────

function statuslineConfigPath(): string {
  return join(homedir(), '.config', 'annulus', 'statusline.toml')
}

/**
 * Minimal TOML parser for the statusline config.
 *
 * The annulus statusline.toml has a predictable, flat shape:
 *   [general]
 *   separator = " │ "
 *
 *   [[segments]]
 *   name = "context"
 *   enabled = true
 *   color = "32"
 *
 * Rather than pulling in a full TOML parser, we parse only the fields we need.
 */
function parseStatuslineToml(content: string): StatuslineConfig {
  const configPath = statuslineConfigPath()
  const lines = content.split('\n')

  let separator = DEFAULT_SEPARATOR_DISPLAY
  const segments: StatuslineSegment[] = []
  let current: Partial<StatuslineSegment> | null = null

  function flushSegment() {
    if (current && typeof current.name === 'string') {
      segments.push({
        color: current.color ?? null,
        enabled: current.enabled ?? true,
        line: current.line ?? 1,
        name: current.name,
        separator: current.separator ?? null,
      })
    }
    current = null
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (line === '[[segments]]') {
      flushSegment()
      current = {}
      continue
    }

    if (line === '[general]') {
      flushSegment()
      current = null
      continue
    }

    // Skip comments and empty lines
    if (!line || line.startsWith('#')) continue

    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue

    const key = line.slice(0, eqIndex).trim()
    const rawVal = line.slice(eqIndex + 1).trim()

    // Parse primitive values
    function parseString(v: string): string | null {
      const m = v.match(/^"(.*)"$/)
      return m ? m[1] : null
    }

    function parseBool(v: string): boolean | null {
      if (v === 'true') return true
      if (v === 'false') return false
      return null
    }

    function parseInt2(v: string): number | null {
      const n = Number.parseInt(v, 10)
      return Number.isFinite(n) ? n : null
    }

    if (current !== null) {
      // Inside a [[segments]] block
      if (key === 'name') current.name = parseString(rawVal) ?? undefined
      else if (key === 'enabled') current.enabled = parseBool(rawVal) ?? true
      else if (key === 'color') {
        const s = parseString(rawVal)
        current.color = s && s.length > 0 ? s : null
      } else if (key === 'separator') {
        const s = parseString(rawVal)
        current.separator = s && s.length > 0 ? s : null
      } else if (key === 'line') {
        const n = parseInt2(rawVal)
        current.line = n === 2 ? 2 : 1
      }
    } else {
      // Inside [general] or top-level
      if (key === 'separator') {
        // annulus writes the SeparatorStyle enum variant (e.g. "pipe"); map to display string
        separator = tomlSeparatorToDisplay(parseString(rawVal) ?? DEFAULT_SEPARATOR_TOML)
      }
    }
  }

  flushSegment()

  return {
    config_path: configPath,
    exists: true,
    segments: segments.length > 0 ? segments : DEFAULT_SEGMENTS,
    separator,
  }
}

function readStatuslineConfig(): StatuslineConfig {
  const configPath = statuslineConfigPath()

  try {
    const content = readFileSync(configPath, 'utf-8')
    return parseStatuslineToml(content)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') {
      logger.warn({ err, path: configPath }, 'Failed to read statusline.toml; returning defaults')
    }
    return {
      config_path: configPath,
      exists: false,
      segments: DEFAULT_SEGMENTS,
      separator: DEFAULT_SEPARATOR_DISPLAY,
    }
  }
}

function segmentToToml(seg: StatuslineSegment): string {
  const lines: string[] = ['[[segments]]', `name = "${seg.name}"`, `enabled = ${seg.enabled}`]
  // color is constrained to /^\d+(;\d+)*$/ — no escaping needed
  if (seg.color !== null) lines.push(`color = "${seg.color}"`)
  // per-segment separator override is free-form; escape for TOML safety
  if (seg.separator !== null) lines.push(`separator = "${escapeTomlString(seg.separator)}"`)
  if (seg.line === 2) lines.push(`line = ${seg.line}`)
  return lines.join('\n')
}

function serializeStatuslineConfig(config: StatuslineConfig): string {
  // Convert display separator (e.g. ' │ ') to annulus SeparatorStyle enum name (e.g. 'pipe')
  const separatorToml = displaySeparatorToToml(config.separator)
  const parts: string[] = [
    '# Generated by cap statusline editor',
    '',
    '[general]',
    `separator = "${separatorToml}"`,
    '',
    ...config.segments.map((seg) => `${segmentToToml(seg)}\n`),
  ]
  return parts.join('\n')
}

function writeStatuslineConfig(config: StatuslineConfig): void {
  const configPath = statuslineConfigPath()
  const configDir = join(homedir(), '.config', 'annulus')
  const tmpPath = `${configPath}.tmp`

  mkdirSync(configDir, { recursive: true })
  writeFileSync(tmpPath, serializeStatuslineConfig(config), 'utf-8')
  renameSync(tmpPath, configPath)
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_PATTERN = /^\d+(;\d+)*$/

function isValidLine(v: unknown): v is 1 | 2 {
  return v === 1 || v === 2
}

function validateSegment(seg: unknown, index: number): string | null {
  if (!seg || typeof seg !== 'object' || Array.isArray(seg)) {
    return `segments[${index}] must be an object`
  }
  const s = seg as Record<string, unknown>

  if (typeof s.name !== 'string' || !KNOWN_SEGMENT_NAMES.has(s.name)) {
    return `segments[${index}].name "${s.name}" is not a known segment name`
  }
  if (typeof s.enabled !== 'boolean') {
    return `segments[${index}].enabled must be a boolean`
  }
  if (s.color !== null && s.color !== undefined) {
    if (typeof s.color !== 'string' || !COLOR_PATTERN.test(s.color)) {
      return `segments[${index}].color must match /^\\d+(;\\d+)*$/ or be null`
    }
  }
  if (s.separator !== null && s.separator !== undefined && typeof s.separator !== 'string') {
    return `segments[${index}].separator must be a string or null`
  }
  if (s.line !== undefined && s.line !== null && !isValidLine(s.line)) {
    return `segments[${index}].line must be 1 or 2`
  }

  return null
}

function validatePayload(body: unknown): { config: StatuslineConfig; error: string } | { config: StatuslineConfig } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { config: {} as StatuslineConfig, error: 'Request body must be an object' }
  }

  const b = body as Record<string, unknown>

  if (!Array.isArray(b.segments)) {
    return { config: {} as StatuslineConfig, error: 'segments must be an array' }
  }

  for (let i = 0; i < b.segments.length; i++) {
    const err = validateSegment(b.segments[i], i)
    if (err) return { config: {} as StatuslineConfig, error: err }
  }

  if (b.separator !== undefined) {
    if (typeof b.separator !== 'string' || b.separator.length === 0) {
      return { config: {} as StatuslineConfig, error: 'separator must be a non-empty string' }
    }
  }

  const config: StatuslineConfig = {
    config_path: statuslineConfigPath(),
    exists: true,
    segments: (b.segments as Array<Record<string, unknown>>).map((s) => ({
      color: typeof s.color === 'string' ? s.color : null,
      enabled: s.enabled as boolean,
      line: isValidLine(s.line) ? s.line : 1,
      name: s.name as string,
      separator: typeof s.separator === 'string' ? s.separator : null,
    })),
    separator: typeof b.separator === 'string' ? b.separator : DEFAULT_SEPARATOR_DISPLAY,
  }

  return { config }
}

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

const app = new Hono()

app.get('/', (c) => {
  const config = readStatuslineConfig()
  return c.json(config)
})

app.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body', ok: false }, 400)
  }

  const result = validatePayload(body)
  if ('error' in result) {
    return c.json({ error: result.error, ok: false }, 400)
  }

  try {
    writeStatuslineConfig(result.config)
    logger.info({ path: statuslineConfigPath() }, 'statusline config written')
    return c.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'Failed to write statusline config')
    return c.json({ error: 'Failed to write config file', ok: false }, 500)
  }
})

export default app
