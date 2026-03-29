import type { Hono } from 'hono'
import { mkdirSync, writeFileSync } from 'node:fs'

import { appConfigDir, appConfigPath } from '../../lib/platform.ts'
import { logger } from '../../logger.ts'
import { getHyphaeSettings, getMyceliumSettings, getRhizomeSettings, readRawToml } from './config.ts'
import { runHyphae } from './shared.ts'

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
      const body = await c.req.json().catch(() => ({}))
      const configPath = appConfigPath('mycelium')
      const configDir = appConfigDir('mycelium')

      mkdirSync(configDir, { recursive: true })

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
      const configPath = appConfigPath('rhizome')
      const configDir = appConfigDir('rhizome')

      mkdirSync(configDir, { recursive: true })

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
      const configPath = appConfigPath('hyphae')
      const configDir = appConfigDir('hyphae')

      mkdirSync(configDir, { recursive: true })

      let existing = readRawToml(configPath) ?? ''

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

      writeFileSync(configPath, `${existing.trim()}\n`, 'utf-8')

      return c.json(getHyphaeSettings())
    } catch (err) {
      logger.error({ err }, 'Failed to write hyphae config')
      return c.json({ error: 'Failed to write hyphae config' }, 500)
    }
  })
}
