import type { Hono } from 'hono'
import { mkdirSync, writeFileSync } from 'node:fs'

import { appConfigDir, appConfigPath } from '../../lib/platform.ts'
import { logger } from '../../logger.ts'
import { getHyphaeSettings, getMyceliumSettings, getRhizomeSettings, readRawToml } from './config.ts'
import { runHyphae } from './shared.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function serializeTomlScalar(value: string | number | boolean): string {
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') return String(value)
  return value ? 'true' : 'false'
}

function serializeTomlStringArray(values: string[]): string {
  return `[${values.map((value) => serializeTomlScalar(value)).join(', ')}]`
}

function upsertTomlScalar(content: string, key: string, value: string | number | boolean): string {
  const line = `${key} = ${serializeTomlScalar(value)}`
  const pattern = new RegExp(`^${escapeRegExp(key)}\\s*=.*$`, 'm')
  return pattern.test(content) ? content.replace(pattern, line) : `${content}\n${line}`
}

export function registerWriteRoutes(app: Hono) {
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

  app.put('/mycelium', async (c) => {
    try {
      const body = await c.req.json().catch(() => null)
      if (!isRecord(body)) {
        return c.json({ error: 'Invalid settings payload' }, 400)
      }
      if (body.hyphae_enabled !== undefined && typeof body.hyphae_enabled !== 'boolean') {
        return c.json({ error: 'hyphae_enabled must be a boolean' }, 400)
      }
      if (body.rhizome_enabled !== undefined && typeof body.rhizome_enabled !== 'boolean') {
        return c.json({ error: 'rhizome_enabled must be a boolean' }, 400)
      }

      const configPath = appConfigPath('mycelium')
      const configDir = appConfigDir('mycelium')

      mkdirSync(configDir, { recursive: true })

      const existing = getMyceliumSettings()
      const hyphaeEnabled = body.hyphae_enabled ?? existing.filters.hyphae.enabled
      const rhizomeEnabled = body.rhizome_enabled ?? existing.filters.rhizome.enabled

      const content = [
        '[filters.hyphae]',
        `enabled = ${serializeTomlScalar(hyphaeEnabled)}`,
        '',
        '[filters.rhizome]',
        `enabled = ${serializeTomlScalar(rhizomeEnabled)}`,
        '',
      ].join('\n')

      writeFileSync(configPath, content, 'utf-8')

      return c.json(getMyceliumSettings())
    } catch (err) {
      logger.error({ err }, 'Failed to write mycelium config')
      return c.json({ error: 'Failed to write mycelium config' }, 500)
    }
  })

  app.put('/rhizome', async (c) => {
    try {
      const body = await c.req.json().catch(() => null)
      if (!isRecord(body)) {
        return c.json({ error: 'Invalid settings payload' }, 400)
      }
      if (body.auto_export !== undefined && typeof body.auto_export !== 'boolean') {
        return c.json({ error: 'auto_export must be a boolean' }, 400)
      }
      if (body.languages !== undefined) {
        if (!Array.isArray(body.languages) || body.languages.some((language) => !isNonEmptyString(language))) {
          return c.json({ error: 'languages must be an array of non-empty strings' }, 400)
        }
      }

      const configPath = appConfigPath('rhizome')
      const configDir = appConfigDir('rhizome')

      mkdirSync(configDir, { recursive: true })

      const existing = getRhizomeSettings()
      const autoExport = body.auto_export ?? existing.auto_export

      let content = `auto_export = ${serializeTomlScalar(autoExport)}\n`
      if (body.languages !== undefined) {
        content += `languages = ${serializeTomlStringArray(body.languages)}\n`
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
      const body = await c.req.json().catch(() => null)
      if (!isRecord(body)) {
        return c.json({ error: 'Invalid settings payload' }, 400)
      }
      if (body.embedding_model !== undefined && !isNonEmptyString(body.embedding_model)) {
        return c.json({ error: 'embedding_model must be a non-empty string' }, 400)
      }

      const configPath = appConfigPath('hyphae')
      const configDir = appConfigDir('hyphae')

      mkdirSync(configDir, { recursive: true })

      let existing = readRawToml(configPath) ?? ''

      if (body.embedding_model !== undefined) {
        existing = upsertTomlScalar(existing, 'embedding_model', body.embedding_model)
      }
      if (body.similarity_threshold !== undefined) {
        const threshold = Number(body.similarity_threshold)
        if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
          return c.json({ error: 'similarity_threshold must be a number between 0 and 1' }, 400)
        }
        existing = upsertTomlScalar(existing, 'similarity_threshold', threshold)
      }

      writeFileSync(configPath, `${existing.trim()}\n`, 'utf-8')

      return c.json(getHyphaeSettings())
    } catch (err) {
      logger.error({ err }, 'Failed to write hyphae config')
      return c.json({ error: 'Failed to write hyphae config' }, 500)
    }
  })
}
