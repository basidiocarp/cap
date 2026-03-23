import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { Hono } from 'hono'

import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { activateMode, loadModes } from '../lib/modes.ts'
import { logger } from '../logger.ts'

const runHyphae = createCliRunner(HYPHAE_BIN, 'hyphae')
const exec = promisify(execFile)

const STIPE_ACTIONS = {
  doctor: ['doctor'],
  init: ['init'],
  'install-claude-code': ['install', '--profile', 'claude-code'],
  'install-full-stack': ['install', '--profile', 'full-stack'],
  'install-minimal': ['install', '--profile', 'minimal'],
} as const

export type AllowedStipeAction = keyof typeof STIPE_ACTIONS

export function parseStipeAction(action: string): AllowedStipeAction | null {
  return action in STIPE_ACTIONS ? (action as AllowedStipeAction) : null
}

export function buildStipeArgs(action: AllowedStipeAction): string[] {
  return [...STIPE_ACTIONS[action]]
}

async function runStipe(args: string[]): Promise<string> {
  const { stdout } = await exec('stipe', args, {
    env: { ...process.env, NO_COLOR: '1' },
    timeout: 30_000,
  })
  return stdout.trim()
}

function readToml(filePath: string): string | null {
  try {
    if (!existsSync(filePath)) return null
    return readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

function tomlBool(content: string, key: string, fallback: boolean): boolean {
  const match = content.match(new RegExp(`^\\s*${key}\\s*=\\s*(true|false)`, 'm'))
  return match ? match[1] === 'true' : fallback
}

function tomlArrayLength(content: string, key: string): number {
  const match = content.match(new RegExp(`^\\s*${key}\\s*=\\s*\\[([^\\]]*)\\]`, 'm'))
  if (!match) return 0
  const items = match[1].trim()
  if (items.length === 0) return 0
  return items.split(',').filter((s) => s.trim().length > 0).length
}

function sectionEnabled(content: string, section: string): boolean {
  const regex = new RegExp(`\\[${section.replace('.', '\\.')}\\][\\s\\S]*?enabled\\s*=\\s*(true|false)`)
  const match = content.match(regex)
  if (match) return match[1] === 'true'
  return content.includes(`[${section}]`)
}

function getHyphaeSettings(): {
  config_path: string | null
  db_path: string
  db_size_bytes: number
} {
  const configPath = join(homedir(), '.config', 'hyphae', 'config.toml')
  const defaultDb =
    platform() === 'darwin'
      ? join(homedir(), 'Library', 'Application Support', 'hyphae', 'hyphae.db')
      : join(process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'), 'hyphae', 'hyphae.db')
  const dbPath = process.env.HYPHAE_DB ?? defaultDb

  let configExists = false
  try {
    configExists = existsSync(configPath)
  } catch {
    // ignore
  }

  let dbSizeBytes = 0
  try {
    dbSizeBytes = statSync(dbPath).size
  } catch {
    // DB file may not exist
  }

  return {
    config_path: configExists ? configPath : null,
    db_path: dbPath,
    db_size_bytes: dbSizeBytes,
  }
}

function getMyceliumSettings(): {
  config_path: string | null
  filters: {
    hyphae: { enabled: boolean }
    rhizome: { enabled: boolean }
  }
} {
  const configPath = join(homedir(), '.config', 'mycelium', 'config.toml')
  const content = readToml(configPath)

  if (!content) {
    return {
      config_path: null,
      filters: {
        hyphae: { enabled: false },
        rhizome: { enabled: false },
      },
    }
  }

  return {
    config_path: configPath,
    filters: {
      hyphae: { enabled: sectionEnabled(content, 'filters.hyphae') },
      rhizome: { enabled: sectionEnabled(content, 'filters.rhizome') },
    },
  }
}

function getRhizomeSettings(): {
  auto_export: boolean
  config_path: string | null
  languages_enabled: number
} {
  const configPath = join(homedir(), '.config', 'rhizome', 'config.toml')
  const content = readToml(configPath)

  if (!content) {
    return {
      auto_export: false,
      config_path: null,
      languages_enabled: 32,
    }
  }

  const explicitLanguages = tomlArrayLength(content, 'languages')
  return {
    auto_export: tomlBool(content, 'auto_export', false),
    config_path: configPath,
    // No languages array means all 32 are enabled (default)
    languages_enabled: explicitLanguages > 0 ? explicitLanguages : 32,
  }
}

const app = new Hono()

app.get('/', async (c) => {
  try {
    const settings = {
      hyphae: getHyphaeSettings(),
      mycelium: getMyceliumSettings(),
      rhizome: getRhizomeSettings(),
    }
    return c.json(settings)
  } catch (err) {
    logger.error({ err }, 'Failed to read settings')
    return c.json({ error: 'Failed to read settings' }, 500)
  }
})

app.post('/hyphae/prune', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const args = ['prune']

    if (body.threshold != null) {
      const t = Number(body.threshold)
      if (!Number.isFinite(t) || t < 0 || t > 1) {
        return c.json({ error: 'threshold must be a number between 0 and 1' }, 400)
      }
      args.push('--threshold', String(t))
    }

    const stdout = await runHyphae(args)
    const match = stdout.match(/pruned\s+(\d+)/i)
    const pruned = match ? Number.parseInt(match[1], 10) : 0

    return c.json({ message: match ? stdout : stdout, pruned })
  } catch (err) {
    logger.error({ err }, 'Prune failed')
    return c.json({ error: 'Prune operation failed' }, 500)
  }
})

app.get('/modes', (c) => {
  try {
    return c.json(loadModes())
  } catch (err) {
    logger.error({ err }, 'Failed to load modes')
    return c.json({ error: 'Failed to load modes' }, 500)
  }
})

app.post('/modes/activate', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const mode = body.mode
    if (!mode || typeof mode !== 'string') {
      return c.json({ error: 'Missing required field: mode' }, 400)
    }
    const updated = activateMode(mode)
    return c.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to activate mode'
    logger.error({ err }, 'Mode activation failed')
    return c.json({ error: message }, 400)
  }
})

app.post('/stipe/run', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const action = typeof body.action === 'string' ? parseStipeAction(body.action) : null

    if (!action) {
      return c.json({ error: 'Missing or invalid action' }, 400)
    }

    const args = buildStipeArgs(action)
    const output = await runStipe(args)

    return c.json({
      action,
      command: `stipe ${args.join(' ')}`,
      output,
    })
  } catch (err) {
    logger.error({ err }, 'Stipe action failed')
    return c.json({ error: 'Stipe action failed' }, 500)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Config write endpoints
// ─────────────────────────────────────────────────────────────────────────────

app.put('/mycelium', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const configPath = join(homedir(), '.config', 'mycelium', 'config.toml')
    const configDir = join(homedir(), '.config', 'mycelium')

    mkdirSync(configDir, { recursive: true })

    // Read existing settings to merge with
    const existing = getMyceliumSettings()
    const hyphaeEnabled = body.hyphae_enabled ?? existing.filters.hyphae.enabled
    const rhizomeEnabled = body.rhizome_enabled ?? existing.filters.rhizome.enabled

    const content = `[filters.hyphae]\nenabled = ${hyphaeEnabled}\n\n[filters.rhizome]\nenabled = ${rhizomeEnabled}\n`

    writeFileSync(configPath, content, 'utf-8')

    return c.json(getMyceliumSettings())
  } catch (err) {
    logger.error({ err }, 'Failed to write mycelium config')
    return c.json({ error: 'Failed to write mycelium config' }, 500)
  }
})

app.put('/rhizome', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const configPath = join(homedir(), '.config', 'rhizome', 'config.toml')
    const configDir = join(homedir(), '.config', 'rhizome')

    mkdirSync(configDir, { recursive: true })

    // Read existing settings to merge with
    const existing = getRhizomeSettings()
    const autoExport = body.auto_export ?? existing.auto_export

    let content = `auto_export = ${autoExport}\n`
    if (Array.isArray(body.languages)) {
      const langs = body.languages.map((l: unknown) => `"${l}"`).join(', ')
      content += `languages = [${langs}]\n`
    }

    writeFileSync(configPath, content, 'utf-8')

    return c.json(getRhizomeSettings())
  } catch (err) {
    logger.error({ err }, 'Failed to write rhizome config')
    return c.json({ error: 'Failed to write rhizome config' }, 500)
  }
})

app.put('/hyphae', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const configPath = join(homedir(), '.config', 'hyphae', 'config.toml')
    const configDir = join(homedir(), '.config', 'hyphae')

    mkdirSync(configDir, { recursive: true })

    // Read existing config to preserve unmanaged settings
    let existing = readToml(configPath) ?? ''

    if (body.embedding_model !== undefined && typeof body.embedding_model === 'string') {
      const re = /^embedding_model\s*=.*$/m
      const line = `embedding_model = "${body.embedding_model}"`
      existing = re.test(existing) ? existing.replace(re, line) : `${existing}\n${line}`
    }
    if (body.similarity_threshold !== undefined) {
      const threshold = Number(body.similarity_threshold)
      if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
        return c.json({ error: 'similarity_threshold must be a number between 0 and 1' }, 400)
      }
      const re = /^similarity_threshold\s*=.*$/m
      const line = `similarity_threshold = ${threshold}`
      existing = re.test(existing) ? existing.replace(re, line) : `${existing}\n${line}`
    }

    writeFileSync(configPath, existing.trim() + '\n', 'utf-8')

    const settings = getHyphaeSettings()
    return c.json(settings)
  } catch (err) {
    logger.error({ err }, 'Failed to write hyphae config')
    return c.json({ error: 'Failed to write hyphae config' }, 500)
  }
})

export default app
