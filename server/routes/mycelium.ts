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

export default app
