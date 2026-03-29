import { Hono } from 'hono'

import * as canopy from '../canopy.ts'

const app = new Hono()
const ALLOWED_SORTS = new Set(['status', 'title', 'updated_at', 'created_at', 'verification', 'priority', 'severity', 'attention'])
const ALLOWED_VIEWS = new Set(['all', 'active', 'blocked', 'review', 'handoffs', 'attention'])
const ALLOWED_PRESETS = new Set(['default', 'attention', 'review_queue', 'blocked', 'handoffs', 'critical', 'unacknowledged'])
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])
const ALLOWED_SEVERITIES = new Set(['none', 'low', 'medium', 'high', 'critical'])
const ALLOWED_ATTENTION_LEVELS = new Set(['normal', 'needs_attention', 'critical'])
const ALLOWED_ACKNOWLEDGED = new Set(['true', 'false'])

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
    const body = (await c.req.json().catch(() => ({}))) as {
      action?: string
      assigned_to?: string
      blocked_reason?: string
      changed_by?: string
      clear_owner_note?: boolean
      note?: string
      owner_note?: string
      priority?: string
      severity?: string
    }

    if (!body.action || !body.changed_by) {
      return c.json({ error: 'Canopy task action requires action and changed_by' }, 400)
    }

    return c.json(
      await canopy.applyTaskAction(c.req.param('taskId'), {
        action: body.action,
        assignedTo: body.assigned_to,
        blockedReason: body.blocked_reason,
        changedBy: body.changed_by,
        clearOwnerNote: body.clear_owner_note,
        note: body.note,
        ownerNote: body.owner_note,
        priority: body.priority,
        severity: body.severity,
      })
    )
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to apply Canopy task action' }, 500)
  }
})

app.post('/handoffs/:handoffId/actions', async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as {
      action?: string
      changed_by?: string
      note?: string
    }

    if (!body.action || !body.changed_by) {
      return c.json({ error: 'Canopy handoff action requires action and changed_by' }, 400)
    }

    return c.json(
      await canopy.applyHandoffAction(c.req.param('handoffId'), {
        action: body.action,
        changedBy: body.changed_by,
        note: body.note,
      })
    )
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to apply Canopy handoff action' }, 500)
  }
})

export default app
