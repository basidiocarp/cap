import { Hono } from 'hono'

import * as mycelium from '../mycelium.ts'

const app = new Hono()

app.get('/gain', async (c) => {
  const format = (c.req.query('format') ?? 'json') as 'json' | 'text'
  const data = await mycelium.getGain(format)
  return c.json(data)
})

app.get('/gain/history', async (c) => {
  const format = (c.req.query('format') ?? 'json') as 'json' | 'text'
  const data = await mycelium.getGainHistory(format)
  return c.json(data)
})

app.get('/analytics', async (c) => {
  try {
    const data = await mycelium.getAnalytics()
    return c.json(data)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get analytics' }, 500)
  }
})

app.get('/history', async (c) => {
  try {
    const limit = c.req.query('limit')
    const clampedLimit = Math.min(Math.max(parseInt(limit ?? '50', 10), 10), 200)
    const data = await mycelium.getCommandHistory(clampedLimit)
    return c.json(data)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get history' }, 500)
  }
})

export default app
