import type { Context, Next } from 'hono'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { logger } from './logger.ts'
import hyphaeRoutes from './routes/hyphae.ts'
import myceliumRoutes from './routes/mycelium.ts'

const app = new Hono()

app.use('*', async (c: Context, next: Next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  logger.info({ method: c.req.method, ms, path: c.req.path, status: c.res.status }, `${c.req.method} ${c.req.path}`)
})

app.use('*', cors({ origin: 'http://localhost:5173' }))

app.onError((err, c) => {
  logger.error({ err, method: c.req.method, path: c.req.path }, 'Request error')
  return c.json({ error: 'Internal server error' }, 500)
})

app.route('/api/hyphae', hyphaeRoutes)
app.route('/api/mycelium', myceliumRoutes)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT ?? 3001)

logger.info({ port }, 'Cap server started')

serve({ fetch: app.fetch, port })
