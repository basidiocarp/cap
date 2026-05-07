import { Hono } from 'hono'

import * as hyphae from '../hyphae.ts'
import { getRouteCounters } from '../lib/counters.ts'
import { isGainCliOutput } from '../mycelium/gain.ts'
import { getGain } from '../mycelium.ts'

const app = new Hono()

// GET /api/metrics — Prometheus text exposition format (0.0.4)
// Returns 404 when CAP_METRICS_ENABLED=false (opt-in; operators who don't want
// a scrape target can disable it without removing the route).
// IMPORTANT: no user/session labels — prevents cardinality explosion.
app.get('/', async (c) => {
  if (process.env.CAP_METRICS_ENABLED === 'false') {
    return c.text('metrics disabled', 404)
  }

  const lines: string[] = []

  // ── Request counters ────────────────────────────────────────────────────────
  lines.push('# HELP cap_api_requests_total Total API requests handled by route prefix')
  lines.push('# TYPE cap_api_requests_total counter')
  for (const [route, count] of getRouteCounters()) {
    lines.push(`cap_api_requests_total{route="${route}"} ${count}`)
  }

  // ── Hyphae ─────────────────────────────────────────────────────────────────
  lines.push('# HELP hyphae_memory_count Current memory count in hyphae')
  lines.push('# TYPE hyphae_memory_count gauge')
  lines.push('# HELP hyphae_topic_count Current topic count in hyphae')
  lines.push('# TYPE hyphae_topic_count gauge')

  try {
    const stats = await hyphae.getStats()
    lines.push(`hyphae_memory_count ${stats.total_memories}`)
    lines.push(`hyphae_topic_count ${stats.total_topics}`)
  } catch {
    lines.push('hyphae_memory_count 0')
    lines.push('hyphae_topic_count 0')
  }

  // ── Mycelium ───────────────────────────────────────────────────────────────
  lines.push('# HELP mycelium_tokens_saved_total Total tokens saved by mycelium compression')
  lines.push('# TYPE mycelium_tokens_saved_total counter')
  lines.push('# HELP mycelium_commands_total Total commands processed by mycelium')
  lines.push('# TYPE mycelium_commands_total counter')

  try {
    const gain = await getGain('json')
    if (isGainCliOutput(gain)) {
      lines.push(`mycelium_tokens_saved_total ${gain.summary.total_saved}`)
      lines.push(`mycelium_commands_total ${gain.summary.total_commands}`)
    } else {
      lines.push('mycelium_tokens_saved_total 0')
      lines.push('mycelium_commands_total 0')
    }
  } catch {
    lines.push('mycelium_tokens_saved_total 0')
    lines.push('mycelium_commands_total 0')
  }

  return c.text(lines.join('\n') + '\n', 200, {
    'Content-Type': 'text/plain; version=0.0.4',
  })
})

export default app
