import { Hono } from 'hono'

import { aggregateTelemetry } from '../lib/telemetry.ts'
import { logger } from '../logger.ts'

// Cache-on-success-only: only store the result when aggregation succeeds.
// If aggregateTelemetry() throws, we do not cache the failure so that the
// next request within what would have been the TTL still retries. This lets
// the UI recover as soon as the telemetry directory becomes available.
const TTL_MS = 300_000 // 5 min
let cachedData: ReturnType<typeof aggregateTelemetry> | null = null
let cachedAt = 0

function getTelemetry() {
  const now = Date.now()
  if (cachedData !== null && now - cachedAt < TTL_MS) return cachedData
  try {
    cachedData = aggregateTelemetry()
    cachedAt = now
    return cachedData
  } catch (err) {
    logger.error({ err }, 'Failed to aggregate telemetry')
    return null
  }
}

interface ActivityEvent {
  id: string
  ts: number // unix ms
  kind: 'memory' | 'code' | 'lifecycle' | 'system'
  tool: string
  msg: string
}

const app = new Hono()

app.get('/', (c) => {
  const data = getTelemetry()
  if (!data) return c.json({ error: 'No telemetry available' }, 500)
  return c.json(data)
})

app.get('/activity/recent', (c) => {
  // No event-level data source is plumbed yet.
  // Return empty array and let the frontend show an empty state.
  const events: ActivityEvent[] = []
  return c.json(events)
})

export default app
