import { Hono } from 'hono'

import * as hyphae from '../hyphae.ts'

const app = new Hono()

app.get('/stats', (c) => {
  return c.json(hyphae.getStats())
})

app.get('/topics', (c) => {
  return c.json(hyphae.getTopics())
})

app.get('/topics/:topic/memories', (c) => {
  const limit = c.req.query('limit')
  return c.json(hyphae.getMemoriesByTopic(c.req.param('topic'), limit ? Number(limit) : undefined))
})

app.get('/recall', (c) => {
  const query = c.req.query('q')
  if (!query) return c.json({ error: 'Missing query parameter "q"' }, 400)
  const topic = c.req.query('topic')
  const limit = c.req.query('limit')
  return c.json(hyphae.recall(query, topic ?? undefined, limit ? Number(limit) : undefined))
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
  const query = c.req.query('q')
  if (!query) return c.json({ error: 'Missing query parameter "q"' }, 400)
  return c.json(hyphae.memoirSearchAll(query))
})

app.get('/memoirs/:name', (c) => {
  const data = hyphae.memoirShow(c.req.param('name'))
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

app.get('/memoirs/:name/inspect/:concept', (c) => {
  const depth = c.req.query('depth')
  const data = hyphae.memoirInspect(c.req.param('name'), c.req.param('concept'), depth ? Number(depth) : undefined)
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

app.get('/memoirs/:name/search', (c) => {
  const query = c.req.query('q')
  if (!query) return c.json({ error: 'Missing query parameter "q"' }, 400)
  return c.json(hyphae.memoirSearch(c.req.param('name'), query))
})

// --- Writes (shell to CLI) ---

app.post('/store', async (c) => {
  const body = await c.req.json<{ topic: string; summary: string; importance?: string; keywords?: string[] }>()
  const result = await hyphae.store(body.topic, body.summary, body.importance, body.keywords)
  return c.json({ result })
})

app.delete('/memories/:id', async (c) => {
  const result = await hyphae.forget(c.req.param('id'))
  return c.json({ result })
})

app.post('/consolidate', async (c) => {
  const body = await c.req.json<{ topic: string; keep_originals?: boolean }>()
  const result = await hyphae.consolidate(body.topic, body.keep_originals)
  return c.json({ result })
})

export default app
