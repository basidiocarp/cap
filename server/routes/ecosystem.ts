import { Hono } from 'hono'

import { getAnnulusStatus } from '../annulus.ts'

const app = new Hono()

app.get('/status', async (c) => {
  return c.json(await getAnnulusStatus())
})

export default app
