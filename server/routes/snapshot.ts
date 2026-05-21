import { Hono } from 'hono'

import { assembleSnapshot } from '../snapshot.ts'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const snapshot = await assembleSnapshot()
    return c.json(snapshot)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
