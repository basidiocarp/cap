import { Hono } from 'hono'

import { createCliRunner } from '../lib/cli.ts'
import { RHIZOME_BIN } from '../lib/config.ts'
import { logger } from '../logger.ts'

const runRhizome = createCliRunner(RHIZOME_BIN, 'rhizome')

const app = new Hono()

app.get('/status', async (c) => {
  try {
    const stdout = await runRhizome(['lsp', 'status', '--json'])
    const result = JSON.parse(stdout)
    return c.json({ available: true, languages: result })
  } catch (err) {
    logger.debug({ err }, 'Rhizome LSP status unavailable')
    return c.json({ available: false, languages: [] })
  }
})

app.post('/install', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const language = body.language

  if (!language || typeof language !== 'string') {
    return c.json({ error: 'Missing or invalid required field: language' }, 400)
  }

  try {
    const stdout = await runRhizome(['lsp', 'install', language])
    const installed = !stdout.toLowerCase().includes('failed') && !stdout.toLowerCase().includes('not found')
    return c.json({ installed, language, message: stdout })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'LSP install failed'
    logger.error({ err }, `LSP install failed for ${language}`)
    return c.json({ error: message, installed: false, language, message }, 500)
  }
})

export default app
