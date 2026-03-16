import type { Context, Next } from 'hono'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { closeDb } from './db.ts'
import { logger } from './logger.ts'
import hyphaeRoutes from './routes/hyphae.ts'
import myceliumRoutes from './routes/mycelium.ts'
import rhizomeRoutes from './routes/rhizome.ts'
import statusRoutes from './routes/status.ts'

export function createApp(): Hono {
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
  app.route('/api/rhizome', rhizomeRoutes)
  app.route('/api/status', statusRoutes)

  app.get('/api/health', (c) => c.json({ status: 'ok' }))

  return app
}

const app = createApp()
const port = Number(process.env.PORT ?? 3001)

logger.info({ port }, 'Cap server started')

serve({ fetch: app.fetch, port })

function shutdown() {
  logger.info('Shutting down')
  closeDb()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
