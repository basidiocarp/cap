import { Hono } from 'hono'

import * as hyphae from '../hyphae.ts'
import { HyphaeSessionTimelineDetailCliError } from '../hyphae/session-timeline-detail-cli.ts'

const app = new Hono()

app.get('/:id/timeline', async (c) => {
  try {
    const events = await hyphae.getSessionTimelineEvents(c.req.param('id'))
    return c.json(events)
  } catch (err) {
    if (err instanceof HyphaeSessionTimelineDetailCliError && err.kind === 'not_found') {
      return c.json({ error: 'Not found' }, 404)
    }

    return c.json({ error: 'Hyphae session timeline unavailable' }, 502)
  }
})

export default app
