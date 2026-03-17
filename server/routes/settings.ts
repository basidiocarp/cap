import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { Hono } from 'hono'

import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { logger } from '../logger.ts'

const runHyphae = createCliRunner(HYPHAE_BIN, 'hyphae')

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

function getHyphaeSettings(): {
  config_path: string | null
  db_path: string
  db_size_bytes: number
} {
  const configPath = join(homedir(), '.config', 'hyphae', 'config.toml')
  const dbPath = process.env.HYPHAE_DB ?? join(homedir(), '.local', 'share', 'hyphae', 'hyphae.db')

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
      hyphae: { enabled: tomlBool(content, 'enabled', false) || content.includes('[filters.hyphae]') },
      rhizome: { enabled: tomlBool(content, 'enabled', false) || content.includes('[filters.rhizome]') },
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
      languages_enabled: 0,
    }
  }

  return {
    auto_export: tomlBool(content, 'auto_export', false),
    config_path: configPath,
    languages_enabled: tomlArrayLength(content, 'languages'),
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

export default app
