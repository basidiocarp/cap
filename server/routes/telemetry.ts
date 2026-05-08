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
  // No event-level data available in current telemetry system,
  // return placeholder events as specified in the handoff
  const now = Date.now()
  const events: ActivityEvent[] = [
    {
      id: 'evt-1',
      ts: now - 15_000,
      kind: 'memory',
      tool: 'hyphae',
      msg: 'Stored session memory for debugging workflow',
    },
    {
      id: 'evt-2',
      ts: now - 45_000,
      kind: 'code',
      tool: 'rhizome',
      msg: 'Scanned 1,243 symbols in codebase',
    },
    {
      id: 'evt-3',
      ts: now - 120_000,
      kind: 'lifecycle',
      tool: 'cortina',
      msg: 'Session started with task context',
    },
    {
      id: 'evt-4',
      ts: now - 300_000,
      kind: 'system',
      tool: 'mycelium',
      msg: 'Filtered 8,294 tokens from cargo output',
    },
    {
      id: 'evt-5',
      ts: now - 600_000,
      kind: 'memory',
      tool: 'hyphae',
      msg: 'Consolidated 42 memories on error patterns',
    },
  ]
  return c.json(events)
})

export default app
