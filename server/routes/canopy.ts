import { Hono } from 'hono'

import * as canopy from '../canopy.ts'

const app = new Hono()
const ALLOWED_SORTS = new Set(['status', 'title', 'updated_at', 'created_at', 'verification'])
const ALLOWED_VIEWS = new Set(['all', 'active', 'blocked', 'review', 'handoffs', 'attention'])

app.get('/snapshot', async (c) => {
  try {
    const rawSort = c.req.query('sort')
    const rawView = c.req.query('view')

    return c.json(
      await canopy.getSnapshot({
        projectRoot: c.req.query('project') || undefined,
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

export default app
