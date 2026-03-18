import { Hono } from 'hono'

import { cachedAsync } from '../lib/cache.ts'
import { aggregateUsage, scanAllSessions, usageTrend } from '../lib/usage.ts'
import { logger } from '../logger.ts'

const getUsageData = cachedAsync(() => {
  try {
    return scanAllSessions()
  } catch (err) {
    logger.error({ err }, 'Failed to scan sessions')
    return []
  }
}, 60_000)

const app = new Hono()

app.get('/', async (c) => {
  const sessions = await getUsageData()
  return c.json(aggregateUsage(sessions))
})

app.get('/sessions', async (c) => {
  const since = c.req.query('since')
  const limit = Number.parseInt(c.req.query('limit') ?? '20', 10)
  const sessions = await getUsageData()

  let filtered = sessions
  if (since) {
    filtered = sessions.filter((s) => s.timestamp >= since)
  }

  return c.json(filtered.slice(0, limit))
})

app.get('/trend', async (c) => {
  const days = Number.parseInt(c.req.query('days') ?? '30', 10)
  const sessions = await getUsageData()
  return c.json(usageTrend(sessions, days))
})

export default app
