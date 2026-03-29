import { Hono } from 'hono'

import { getStatus } from './status/checks.ts'

const app = new Hono()

app.get('/', async (c) => {
  return c.json(await getStatus())
})

export default app
