import { Hono } from 'hono'

import { cached } from '../lib/cache.ts'
import { aggregateUsage, scanAllSessions, usageTrend } from '../lib/usage.ts'

const getUsageData = cached(() => scanAllSessions(), 60_000)

const app = new Hono()

app.get('/', (c) => {
  const sessions = getUsageData()
  return c.json(aggregateUsage(sessions))
})

app.get('/sessions', (c) => {
  const since = c.req.query('since')
  const limitParam = c.req.query('limit') ?? '20'
  const limit = Number.parseInt(limitParam, 10)
  if (!Number.isFinite(limit) || limit < 1) {
    return c.json({ error: 'limit must be a positive integer' }, 400)
  }

  const sessions = getUsageData()

  let filtered = sessions
  if (since) {
    filtered = sessions.filter((s) => s.timestamp >= since)
  }

  return c.json(filtered.slice(0, limit).map(({ _transcriptPath: _, ...s }) => s))
})

app.get('/trend', (c) => {
  const days = Number.parseInt(c.req.query('days') ?? '30', 10)
  const sessions = getUsageData()
  return c.json(usageTrend(sessions, days))
})

export default app
