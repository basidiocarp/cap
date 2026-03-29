import { Hono } from 'hono'

import * as hyphae from '../../hyphae.ts'
import { clampParam, requireQuery } from '../../lib/params.ts'

const app = new Hono()

app.get('/stats', (c) => c.json(hyphae.getStats()))
app.get('/topics', (c) => c.json(hyphae.getTopics()))

app.get('/topics/:topic/memories', (c) => {
  const clampedLimit = clampParam(c.req.query('limit'), 20, 200)
  return c.json(hyphae.getMemoriesByTopic(c.req.param('topic'), clampedLimit))
})

app.get('/recall', (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  const clampedLimit = clampParam(c.req.query('limit'), 20, 200)
  return c.json(hyphae.recall(query, c.req.query('topic') ?? undefined, clampedLimit))
})

app.get('/search-global', (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  return c.json(hyphae.searchGlobal(query, clampParam(c.req.query('limit'), 20, 200)))
})

app.get('/memories/:id', (c) => {
  const memory = hyphae.getMemory(c.req.param('id'))
  if (!memory) return c.json({ error: 'Not found' }, 404)
  return c.json(memory)
})

app.get('/health', (c) => c.json(hyphae.getHealth(c.req.query('topic') ?? undefined)))
app.get('/memoirs', (c) => c.json(hyphae.memoirList()))

app.get('/memoirs/search-all', (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  return c.json(hyphae.memoirSearchAll(query))
})

app.get('/memoirs/:name', (c) => {
  const clampedLimit = clampParam(c.req.query('limit'), 200, 500)
  const parsedOffset = Number(c.req.query('offset'))
  const clampedOffset = Number.isFinite(parsedOffset) ? Math.max(0, Math.floor(parsedOffset)) : 0
  const data = hyphae.memoirShow(c.req.param('name'), {
    limit: clampedLimit,
    offset: clampedOffset,
    q: c.req.query('q') ?? undefined,
  })
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

app.get('/memoirs/:name/inspect/:concept', (c) => {
  const data = hyphae.memoirInspect(c.req.param('name'), c.req.param('concept'), clampParam(c.req.query('depth'), 2, 5))
  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

app.get('/memoirs/:name/search', (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  return c.json(hyphae.memoirSearch(c.req.param('name'), query))
})

app.get('/sessions', (c) => {
  const clampedLimit = clampParam(c.req.query('limit'), 20, 200)
  return c.json(hyphae.getSessions(c.req.query('project') ?? undefined, clampedLimit))
})

app.get('/sessions/timeline', (c) => {
  const clampedLimit = clampParam(c.req.query('limit'), 20, 200)
  return c.json(hyphae.getSessionTimeline(c.req.query('project') ?? undefined, clampedLimit))
})

app.get('/lessons', (c) => c.json(hyphae.extractLessons()))
app.get('/analytics', (c) => c.json(hyphae.getAnalytics()))
app.get('/sources', (c) => c.json(hyphae.getIngestionSources()))

app.get('/context', async (c) => {
  const task = requireQuery(c, 'task')
  if (task instanceof Response) return task
  const result = await hyphae.gatherContext(
    task,
    c.req.query('project') ?? undefined,
    clampParam(c.req.query('budget'), 2000, 50000),
    c.req.query('include') ?? undefined
  )
  return c.json(result)
})

export default app
