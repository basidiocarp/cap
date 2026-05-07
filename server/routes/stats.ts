import { Hono } from 'hono'

import * as hyphae from '../hyphae.ts'
import { getSessions } from '../hyphae.ts'
import { isGainCliOutput } from '../mycelium/gain.ts'
import { getGain } from '../mycelium.ts'

const app = new Hono()

// GET /api/stats/memories — memory count, topic count, weight avg from hyphae.
// Contract: septa/cap-stats-memories-v1.schema.json
app.get('/memories', async (c) => {
  try {
    const stats = await hyphae.getStats()
    return c.json({
      avg_weight: stats.avg_weight,
      newest: stats.newest ?? null,
      oldest: stats.oldest ?? null,
      total: stats.total_memories,
      total_topics: stats.total_topics,
    })
  } catch {
    return c.json({ error: 'Hyphae stats unavailable' }, 502)
  }
})

// GET /api/stats/sessions — session count, average duration, most recent session.
// Contract: septa/cap-stats-sessions-v1.schema.json
app.get('/sessions', async (c) => {
  try {
    const sessions = await getSessions({}, 1000)
    const completed = sessions.filter((s) => s.ended_at !== null)
    const avgDurationSeconds =
      completed.length === 0
        ? 0
        : completed.reduce((sum, s) => {
            const ms = new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()
            return sum + ms / 1000
          }, 0) / completed.length

    const sorted = sessions.slice().sort((a, b) => b.started_at.localeCompare(a.started_at))
    const lastSessionAt = sorted[0]?.started_at ?? null

    return c.json({
      average_duration_seconds: Math.round(avgDurationSeconds * 10) / 10,
      last_session_at: lastSessionAt,
      total: sessions.length,
    })
  } catch {
    return c.json({ error: 'Hyphae sessions unavailable' }, 502)
  }
})

// GET /api/stats/savings — mycelium token savings summary.
// Contract: septa/cap-stats-savings-v1.schema.json
app.get('/savings', async (c) => {
  try {
    const gain = await getGain('json')
    if (!isGainCliOutput(gain)) {
      return c.json({ error: 'Mycelium gain returned unexpected format' }, 502)
    }
    return c.json({
      avg_savings_pct: Math.round(gain.summary.avg_savings_pct * 10) / 10,
      total_commands: gain.summary.total_commands,
      total_input_tokens: gain.summary.total_input,
      total_tokens_saved: gain.summary.total_saved,
    })
  } catch {
    return c.json({ error: 'Mycelium gain unavailable' }, 502)
  }
})

export default app
