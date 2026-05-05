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
import { logger } from '../logger.ts'

const app = new Hono()

// Stale-on-error cache for snapshot, keyed by normalized request parameters
const _snapshotCache = new Map<string, { snapshot: unknown; at: number }>()
const SNAPSHOT_STALE_MS = 60_000

/** Clears the stale snapshot cache. Intended for use in tests only. */
export function clearSnapshotCache(): void {
  _snapshotCache.clear()
}

function snapshotCacheKey(opts: Record<string, string | undefined>): string {
  const entries = Object.entries(opts)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(Object.fromEntries(entries))
}

app.get('/snapshot', async (c) => {
  const start = Date.now()

  const rawAcknowledged = c.req.query('acknowledged')
  const rawAttentionAtLeast = c.req.query('attention_at_least')
  const rawPreset = c.req.query('preset')
  const rawPriorityAtLeast = c.req.query('priority_at_least')
  const rawSort = c.req.query('sort')
  const rawSeverityAtLeast = c.req.query('severity_at_least')
  const rawView = c.req.query('view')
  const rawProject = c.req.query('project') || undefined

  const snapshotOpts = {
    acknowledged: rawAcknowledged && ALLOWED_ACKNOWLEDGED.has(rawAcknowledged) ? rawAcknowledged : undefined,
    attentionAtLeast: rawAttentionAtLeast && ALLOWED_ATTENTION_LEVELS.has(rawAttentionAtLeast) ? rawAttentionAtLeast : undefined,
    preset: rawPreset && ALLOWED_PRESETS.has(rawPreset) ? rawPreset : undefined,
    priorityAtLeast: rawPriorityAtLeast && ALLOWED_PRIORITIES.has(rawPriorityAtLeast) ? rawPriorityAtLeast : undefined,
    projectRoot: rawProject,
    severityAtLeast: rawSeverityAtLeast && ALLOWED_SEVERITIES.has(rawSeverityAtLeast) ? rawSeverityAtLeast : undefined,
    sort: rawSort && ALLOWED_SORTS.has(rawSort) ? rawSort : undefined,
    view: rawView && ALLOWED_VIEWS.has(rawView) ? rawView : undefined,
  }

  // Derive cache key from the normalized query parameters
  const cacheKey = snapshotCacheKey({
    acknowledged: snapshotOpts.acknowledged,
    attentionAtLeast: snapshotOpts.attentionAtLeast,
    preset: snapshotOpts.preset,
    priorityAtLeast: snapshotOpts.priorityAtLeast,
    project: snapshotOpts.projectRoot,
    severityAtLeast: snapshotOpts.severityAtLeast,
    sort: snapshotOpts.sort,
    view: snapshotOpts.view,
  })

  try {
    const result = await canopy.getSnapshot(snapshotOpts)

    const duration_ms = Date.now() - start
    logger.info({ duration_ms }, 'canopy snapshot fetched')
    _snapshotCache.set(cacheKey, { at: Date.now(), snapshot: result })
    return c.json(result)
  } catch (_err) {
    const duration_ms = Date.now() - start
    logger.error({ duration_ms, error: _err instanceof Error ? _err.message : String(_err) }, 'canopy snapshot failed')
    const cached = _snapshotCache.get(cacheKey)
    if (cached && Date.now() - cached.at < SNAPSHOT_STALE_MS) {
      return c.json({ ...(cached.snapshot as object), stale: true }, 200)
    }
    return c.json({ error: 'Canopy unavailable', stale: false }, 503)
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

app.get('/facts', async (c) => {
  try {
    const rawKeys = c.req.query('keys')
    const keys = rawKeys ? rawKeys.split(',').filter(Boolean) : undefined
    const scope = c.req.query('scope') || undefined
    const taskId = c.req.query('task_id') || undefined
    return c.json(await canopy.getKnownFacts({ keys, scope, taskId }))
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get known facts' }, 500)
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
