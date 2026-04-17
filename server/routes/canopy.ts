import { Hono } from 'hono'

import * as canopy from '../canopy.ts'
import {
  ALLOWED_ACKNOWLEDGED,
  ALLOWED_ATTENTION_LEVELS,
  ALLOWED_PRESETS,
  ALLOWED_PRIORITIES,
  ALLOWED_SEVERITIES,
  ALLOWED_SORTS,
  ALLOWED_VIEWS,
  validateHandoffAction,
  validateTaskAction,
} from '../lib/canopy-validators.ts'

const app = new Hono()

app.get('/snapshot', async (c) => {
  try {
    const rawAcknowledged = c.req.query('acknowledged')
    const rawAttentionAtLeast = c.req.query('attention_at_least')
    const rawPreset = c.req.query('preset')
    const rawPriorityAtLeast = c.req.query('priority_at_least')
    const rawSort = c.req.query('sort')
    const rawSeverityAtLeast = c.req.query('severity_at_least')
    const rawView = c.req.query('view')

    return c.json(
      await canopy.getSnapshot({
        acknowledged: rawAcknowledged && ALLOWED_ACKNOWLEDGED.has(rawAcknowledged) ? rawAcknowledged : undefined,
        attentionAtLeast: rawAttentionAtLeast && ALLOWED_ATTENTION_LEVELS.has(rawAttentionAtLeast) ? rawAttentionAtLeast : undefined,
        preset: rawPreset && ALLOWED_PRESETS.has(rawPreset) ? rawPreset : undefined,
        priorityAtLeast: rawPriorityAtLeast && ALLOWED_PRIORITIES.has(rawPriorityAtLeast) ? rawPriorityAtLeast : undefined,
        projectRoot: c.req.query('project') || undefined,
        severityAtLeast: rawSeverityAtLeast && ALLOWED_SEVERITIES.has(rawSeverityAtLeast) ? rawSeverityAtLeast : undefined,
        sort: rawSort && ALLOWED_SORTS.has(rawSort) ? rawSort : undefined,
        view: rawView && ALLOWED_VIEWS.has(rawView) ? rawView : undefined,
      })
    )
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get Canopy snapshot' }, 500)
  }
})

app.get('/tasks/:taskId', async (c) => {
  try {
    return c.json(await canopy.getTaskDetail(c.req.param('taskId')))
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get Canopy task detail' }, 500)
  }
})

app.post('/tasks/:taskId/actions', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const validation = validateTaskAction(body)

    if (!validation.ok) {
      return c.json({ error: validation.error }, 400)
    }

    return c.json(await canopy.applyTaskAction(c.req.param('taskId'), validation.data))
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to apply Canopy task action' }, 500)
  }
})

app.post('/handoffs/:handoffId/actions', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const validation = validateHandoffAction(body)

    if (!validation.ok) {
      return c.json({ error: validation.error }, 400)
    }

    return c.json(await canopy.applyHandoffAction(c.req.param('handoffId'), validation.data))
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to apply Canopy handoff action' }, 500)
  }
})

app.get('/agents', async (c) => {
  try {
    return c.json(await canopy.getAgents({ projectRoot: c.req.query('project') || undefined }))
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get Canopy agents' }, 500)
  }
})

app.get('/notifications', (c) => {
  try {
    const rawLimit = c.req.query('limit')
    const limit = rawLimit ? Math.min(Math.max(1, Number.parseInt(rawLimit, 10) || 20), 100) : 20
    const notifications = canopy.listNotifications(limit)
    return c.json({ notifications })
  } catch (err) {
    if (err instanceof Error && err.message.includes('no such file')) {
      return c.json({ notifications: [] })
    }
    return c.json({ error: err instanceof Error ? err.message : 'Failed to list Canopy notifications' }, 500)
  }
})

app.post('/notifications/:id/mark-read', (c) => {
  try {
    const id = c.req.param('id')
    canopy.markNotificationRead(id)
    return c.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message.includes('no such file')) {
      return c.json({ ok: true })
    }
    return c.json({ error: err instanceof Error ? err.message : 'Failed to mark notification read' }, 500)
  }
})

app.post('/notifications/mark-all-read', (c) => {
  try {
    canopy.markAllNotificationsRead()
    return c.json({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message.includes('no such file')) {
      return c.json({ ok: true })
    }
    return c.json({ error: err instanceof Error ? err.message : 'Failed to mark all notifications read' }, 500)
  }
})

export default app
