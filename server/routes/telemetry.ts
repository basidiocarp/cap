import { Hono } from 'hono'

import { cached } from '../lib/cache.ts'
import { aggregateTelemetry } from '../lib/telemetry.ts'
import { logger } from '../logger.ts'

const getTelemetry = cached(() => {
  try {
    return aggregateTelemetry()
  } catch (err) {
    logger.error({ err }, 'Failed to aggregate telemetry')
    return null
  }
}, 300_000) // 5 min cache

const app = new Hono()

app.get('/', (c) => {
  const data = getTelemetry()
  if (!data) return c.json({ error: 'No telemetry available' }, 500)
  return c.json(data)
})

export default app
