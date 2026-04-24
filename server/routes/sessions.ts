import { Hono } from 'hono'

import { getConversationId, setConversationId } from '../lib/capDb.ts'
import { HyphaeSessionTimelineDetailCliError } from '../hyphae/session-timeline-detail-cli.ts'
import * as hyphae from '../hyphae.ts'

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

// GET /:id/conversation — retrieve persisted conversation_id
app.get('/:id/conversation', (c) => {
  try {
    const sessionId = c.req.param('id')
    const conversationId = getConversationId(sessionId)
    return c.json({ session_id: sessionId, conversation_id: conversationId })
  } catch (err) {
    console.error('Error retrieving conversation_id:', err)
    return c.json({ error: 'Failed to retrieve conversation_id' }, 500)
  }
})

// POST /:id/conversation — store conversation_id
app.post('/:id/conversation', async (c) => {
  try {
    const sessionId = c.req.param('id')
    const body = (await c.req.json()) as { conversation_id: string }

    if (!body.conversation_id) {
      return c.json({ error: 'conversation_id is required' }, 400)
    }

    setConversationId(sessionId, body.conversation_id)
    return c.json({ session_id: sessionId, conversation_id: body.conversation_id })
  } catch (err) {
    console.error('Error storing conversation_id:', err)
    return c.json({ error: 'Failed to store conversation_id' }, 500)
  }
})

export default app
