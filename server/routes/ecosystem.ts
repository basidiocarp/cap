import { Hono } from 'hono'

import { getAnnulusConfigExport, getAnnulusStatus } from '../annulus.ts'

const app = new Hono()

app.get('/status', async (c) => {
  return c.json(await getAnnulusStatus())
})

app.get('/config', async (c) => {
  const customization = await getAnnulusConfigExport()
  return c.json(customization)
})

export default app
