import { Hono } from 'hono'

import type { RawEvent } from '../lib/watchers/types.ts'
import { GithubWatcher } from '../lib/watchers/github.ts'
import { registry } from '../lib/watchers/registry.ts'
import { WebhookWatcher } from '../lib/watchers/webhook.ts'
import { logger } from '../logger.ts'

// Register watchers at module load time
registry.register(new WebhookWatcher())
registry.register(new GithubWatcher())

const app = new Hono()

// GET /api/watchers — list available adapters
app.get('/', (c) => {
  return c.json({
    adapters: registry.list(),
  })
})

// POST /api/watchers/webhook — receive raw webhook
app.post('/webhook', async (c) => {
  try {
    const body = await c.req.arrayBuffer()
    const bodyBuffer = Buffer.from(body)
    const signature = c.req.header('X-Webhook-Signature') ?? ''

    // Get secret from environment at request time
    const webhookSecret = process.env.CAP_WEBHOOK_SECRET ?? ''

    const adapter = registry.get('webhook')
    if (!adapter) {
      logger.error('webhook-adapter not registered')
      return c.json({ error: 'Adapter not found' }, 500)
    }

    // Validate signature
    if (!adapter.validate(bodyBuffer, signature, webhookSecret)) {
      logger.warn('webhook: signature validation failed')
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse payload
    let payload: unknown
    try {
      const text = bodyBuffer.toString('utf-8')
      payload = JSON.parse(text)
    } catch (err) {
      logger.error({ err }, 'webhook: failed to parse JSON payload')
      return c.json({ error: 'Invalid JSON' }, 400)
    }

    // Create raw event and transform
    const rawEvent: RawEvent = {
      payload,
      received_at: new Date().toISOString(),
      source: 'webhook',
    }

    const capEvent = adapter.transform(rawEvent)
    registry.dispatch(capEvent)

    return c.json({ event: capEvent.type, success: true })
  } catch (err) {
    logger.error({ err }, 'webhook: request handler error')
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /api/watchers/github — receive GitHub webhook
app.post('/github', async (c) => {
  try {
    const body = await c.req.arrayBuffer()
    const bodyBuffer = Buffer.from(body)
    const signature = c.req.header('X-Hub-Signature-256') ?? ''

    // Get secret from environment at request time
    const githubSecret = process.env.CAP_GITHUB_SECRET ?? ''

    const adapter = registry.get('github')
    if (!adapter) {
      logger.error('github-adapter not registered')
      return c.json({ error: 'Adapter not found' }, 500)
    }

    // Validate signature
    if (!adapter.validate(bodyBuffer, signature, githubSecret)) {
      logger.warn('github: signature validation failed')
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse payload
    let payload: unknown
    try {
      const text = bodyBuffer.toString('utf-8')
      payload = JSON.parse(text)
    } catch (err) {
      logger.error({ err }, 'github: failed to parse JSON payload')
      return c.json({ error: 'Invalid JSON' }, 400)
    }

    // Create raw event and transform
    const rawEvent: RawEvent = {
      payload,
      received_at: new Date().toISOString(),
      source: 'github',
    }

    const capEvent = adapter.transform(rawEvent)
    registry.dispatch(capEvent)

    return c.json({ event: capEvent.type, success: true })
  } catch (err) {
    logger.error({ err }, 'github: request handler error')
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app
