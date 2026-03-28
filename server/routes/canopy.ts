import { Hono } from 'hono'

import * as canopy from '../canopy.ts'

const app = new Hono()

app.get('/snapshot', async (c) => {
  try {
    return c.json(await canopy.getSnapshot())
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
