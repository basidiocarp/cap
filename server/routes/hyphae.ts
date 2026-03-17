import { Hono } from 'hono'

import * as hyphae from '../hyphae.ts'
import { clampParam, requireQuery } from '../lib/params.ts'

const app = new Hono()

app.get('/stats', (c) => {
  return c.json(hyphae.getStats())
})

app.get('/topics', (c) => {
  return c.json(hyphae.getTopics())
})

app.get('/topics/:topic/memories', (c) => {
  const limit = c.req.query('limit')
  const clampedLimit = clampParam(limit, 20, 200)
  return c.json(hyphae.getMemoriesByTopic(c.req.param('topic'), clampedLimit))
})

app.get('/recall', (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  const topic = c.req.query('topic')
  const limit = c.req.query('limit')
  const clampedLimit = clampParam(limit, 20, 200)
  return c.json(hyphae.recall(query, topic ?? undefined, clampedLimit))
})

app.get('/memories/:id', (c) => {
  const memory = hyphae.getMemory(c.req.param('id'))
  if (!memory) return c.json({ error: 'Not found' }, 404)
  return c.json(memory)
})

app.get('/health', (c) => {
  const topic = c.req.query('topic')
  return c.json(hyphae.getHealth(topic ?? undefined))
})

app.get('/memoirs', (c) => {
  return c.json(hyphae.memoirList())
})

app.get('/memoirs/search-all', (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  return c.json(hyphae.memoirSearchAll(query))
})

app.get('/memoirs/:name', (c) => {
  const data = hyphae.memoirShow(c.req.param('name'))
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

app.get('/memoirs/:name/inspect/:concept', (c) => {
  const depth = c.req.query('depth')
  const clampedDepth = clampParam(depth, 2, 5)
  const data = hyphae.memoirInspect(c.req.param('name'), c.req.param('concept'), clampedDepth)
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

app.get('/memoirs/:name/search', (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  return c.json(hyphae.memoirSearch(c.req.param('name'), query))
})

app.get('/analytics', (c) => {
  return c.json(hyphae.getAnalytics())
})

// Writes (shell to CLI)

const VALID_IMPORTANCE = new Set(['critical', 'high', 'medium', 'low', 'ephemeral'])

app.post('/store', async (c) => {
  const body = await c.req.json<{ topic: string; summary: string; importance?: string; keywords?: string[] }>()

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
})

app.delete('/memories/:id', async (c) => {
  const result = await hyphae.forget(c.req.param('id'))
  return c.json({ result })
})

app.post('/consolidate', async (c) => {
  const body = await c.req.json<{ topic: string; keep_originals?: boolean }>()

  if (!body.topic?.trim()) {
    return c.json({ error: 'topic is required' }, 400)
  }

  const result = await hyphae.consolidate(body.topic, body.keep_originals)
  return c.json({ result })
})

export default app
