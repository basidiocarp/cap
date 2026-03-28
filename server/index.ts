import type { Context, Next } from 'hono'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { closeDb } from './db.ts'
import { CAP_API_KEY, CAP_HOST, CORS_ORIGIN } from './lib/config.ts'
import { registry } from './lib/rhizome-registry.ts'
import { logger } from './logger.ts'
import canopyRoutes from './routes/canopy.ts'
import hyphaeRoutes from './routes/hyphae.ts'
import lspRoutes from './routes/lsp.ts'
import myceliumRoutes from './routes/mycelium.ts'
import rhizomeRoutes from './routes/rhizome.ts'
import settingsRoutes from './routes/settings.ts'
import statusRoutes from './routes/status.ts'
import telemetryRoutes from './routes/telemetry.ts'
import usageRoutes from './routes/usage.ts'

// ─────────────────────────────────────────────────────────────────────────────
// API Key Authentication Middleware
// ─────────────────────────────────────────────────────────────────────────────

function createAuthMiddleware() {
  return async (c: Context, next: Next) => {
    // Skip auth for health checks and dev servers (where CAP_API_KEY is not set)
    if (!CAP_API_KEY) {
      await next()
      return
    }

    // Health check endpoint is always allowed
    if (c.req.path === '/api/health') {
      await next()
      return
    }

    // Verify Authorization header for all /api/* endpoints
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      logger.warn({ method: c.req.method, path: c.req.path }, 'Missing Authorization header')
      c.status(401)
      return c.json({ error: 'Authorization required' })
    }

    const [scheme, token] = authHeader.split(' ')
    if (scheme !== 'Bearer' || token !== CAP_API_KEY) {
      logger.warn({ method: c.req.method, path: c.req.path }, 'Invalid API key')
      c.status(403)
      return c.json({ error: 'Unauthorized' })
    }

    await next()
  }
}

export function createApp(): Hono {
  const app = new Hono()

  app.use('*', async (c: Context, next: Next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    logger.info({ method: c.req.method, ms, path: c.req.path, status: c.res.status }, `${c.req.method} ${c.req.path}`)
  })

  app.use('*', cors({ origin: CORS_ORIGIN }))
  app.use('/api/*', createAuthMiddleware())

  app.onError((err, c) => {
    logger.error({ err, method: c.req.method, path: c.req.path }, 'Request error')
    return c.json({ error: 'Internal server error' }, 500)
  })

  app.route('/api/canopy', canopyRoutes)
  app.route('/api/hyphae', hyphaeRoutes)
  app.route('/api/lsp', lspRoutes)
  app.route('/api/mycelium', myceliumRoutes)
  app.route('/api/rhizome', rhizomeRoutes)
  app.route('/api/settings', settingsRoutes)
  app.route('/api/status', statusRoutes)
  app.route('/api/telemetry', telemetryRoutes)
  app.route('/api/usage', usageRoutes)

  app.get('/api/health', (c) => c.json({ status: 'ok' }))

  return app
}

const app = createApp()

export function startServer() {
  const port = Number(process.env.PORT ?? 3001)
  const host = CAP_HOST

  logger.info({ apiKeyRequired: !!CAP_API_KEY, host, port }, 'Cap server started')
  serve({ fetch: app.fetch, hostname: host, port })
}

if (!process.env.VITEST) {
  startServer()
}

function shutdown() {
  logger.info('Shutting down')
  registry.destroyAll()
  closeDb()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
