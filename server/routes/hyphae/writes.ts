import { Hono } from 'hono'

import * as hyphae from '../../hyphae.ts'

const app = new Hono()
const VALID_IMPORTANCE = new Set(['critical', 'high', 'medium', 'low', 'ephemeral'])

app.post('/store', async (c) => {
  try {
    const body = await c.req.json<{ topic: string; summary: string; importance?: string; keywords?: string[] }>().catch(() => undefined)

    if (!body) {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    if (!body.topic?.trim() || !body.summary?.trim()) {
      return c.json({ error: 'topic and summary are required' }, 400)
    }

    if (body.importance && !VALID_IMPORTANCE.has(body.importance.toLowerCase())) {
      return c.json({ error: `Invalid importance. Must be one of: ${[...VALID_IMPORTANCE].join(', ')}` }, 400)
    }

    if (body.keywords && !Array.isArray(body.keywords)) {
      return c.json({ error: 'keywords must be an array' }, 400)
    }

    const result = await hyphae.store(body.topic, body.summary, body.importance, body.keywords)
    return c.json({ result })
  } catch (err) {
    return c.json({ detail: err instanceof Error ? err.message : String(err), error: 'hyphae operation failed' }, 502)
  }
})

app.delete('/memories/:id', async (c) => {
  try {
    const result = await hyphae.forget(c.req.param('id'))
    return c.json({ result })
  } catch (err) {
    return c.json({ detail: err instanceof Error ? err.message : String(err), error: 'hyphae operation failed' }, 502)
  }
})

app.put('/memories/:id/importance', async (c) => {
  try {
    const body = await c.req.json<{ importance: string }>().catch(() => undefined)

    if (!body) {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    if (!body.importance?.trim()) {
      return c.json({ error: 'importance is required' }, 400)
    }

    if (!VALID_IMPORTANCE.has(body.importance.toLowerCase())) {
      return c.json({ error: `Invalid importance. Must be one of: ${[...VALID_IMPORTANCE].join(', ')}` }, 400)
    }

    const result = await hyphae.updateImportance(c.req.param('id'), body.importance)
    return c.json({ result })
  } catch (err) {
    return c.json({ detail: err instanceof Error ? err.message : String(err), error: 'hyphae operation failed' }, 502)
  }
})

app.post('/memories/:id/invalidate', async (c) => {
  const body = await c.req.json<{ reason?: string }>().catch(() => undefined)

  if (body && body.reason !== undefined && typeof body.reason !== 'string') {
    return c.json({ error: 'reason must be a string' }, 400)
  }

  const result = await hyphae.invalidateMemory(c.req.param('id'), body?.reason?.trim() || undefined)
  return c.json({ result })
})

app.post('/consolidate', async (c) => {
  try {
    const body = await c.req.json<{ topic: string; keep_originals?: boolean }>().catch(() => undefined)

    if (!body) {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }

    if (!body.topic?.trim()) {
      return c.json({ error: 'topic is required' }, 400)
    }

    const result = await hyphae.consolidate(body.topic, body.keep_originals)
    return c.json({ result })
  } catch (err) {
    return c.json({ detail: err instanceof Error ? err.message : String(err), error: 'hyphae operation failed' }, 502)
  }
})

export default app
