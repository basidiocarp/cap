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

app.get('/search-global', (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  const limit = c.req.query('limit')
  const clampedLimit = clampParam(limit, 20, 200)
  return c.json(hyphae.searchGlobal(query, clampedLimit))
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
  const limit = c.req.query('limit')
  const offset = c.req.query('offset')
  const query = c.req.query('q')
  const clampedLimit = clampParam(limit, 200, 500)
  const parsedOffset = Number(offset)
  const clampedOffset = Number.isFinite(parsedOffset) ? Math.max(0, Math.floor(parsedOffset)) : 0
  const data = hyphae.memoirShow(c.req.param('name'), {
    limit: clampedLimit,
    offset: clampedOffset,
    q: query ?? undefined,
  })
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

app.get('/sessions', (c) => {
  const project = c.req.query('project')
  const limit = c.req.query('limit')
  const clampedLimit = clampParam(limit, 20, 200)
  return c.json(hyphae.getSessions(project ?? undefined, clampedLimit))
})

app.get('/sessions/timeline', (c) => {
  const project = c.req.query('project')
  const limit = c.req.query('limit')
  const clampedLimit = clampParam(limit, 20, 200)
  return c.json(hyphae.getSessionTimeline(project ?? undefined, clampedLimit))
})

app.get('/lessons', (c) => {
  return c.json(hyphae.extractLessons())
})

app.get('/analytics', (c) => {
  return c.json(hyphae.getAnalytics())
})

app.get('/sources', (c) => {
  return c.json(hyphae.getIngestionSources())
})

app.get('/context', async (c) => {
  const task = requireQuery(c, 'task')
  if (task instanceof Response) return task
  const project = c.req.query('project')
  const budget = clampParam(c.req.query('budget'), 2000, 50000)
  const include = c.req.query('include')
  const result = await hyphae.gatherContext(task, project ?? undefined, budget, include ?? undefined)
  return c.json(result)
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

app.put('/memories/:id/importance', async (c) => {
  const body = await c.req.json<{ importance: string }>()

  if (!body.importance?.trim()) {
    return c.json({ error: 'importance is required' }, 400)
  }

  if (!VALID_IMPORTANCE.has(body.importance.toLowerCase())) {
    return c.json({ error: `Invalid importance. Must be one of: ${[...VALID_IMPORTANCE].join(', ')}` }, 400)
  }

  const result = await hyphae.updateImportance(c.req.param('id'), body.importance)
  return c.json({ result })
})

app.post('/memories/:id/invalidate', async (c) => {
  const body = await c.req.json<{ reason?: string }>().catch(() => undefined)

  if (body && body.reason !== undefined && typeof body.reason !== 'string') {
    return c.json({ error: 'reason must be a string' }, 400)
  }

  const reason = body?.reason?.trim() || undefined
  const result = await hyphae.invalidateMemory(c.req.param('id'), reason)
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
