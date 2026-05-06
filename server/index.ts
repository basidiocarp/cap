import type { Context, Next } from 'hono'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { CAP_HOST, CORS_ORIGIN } from './lib/config.ts'
import { incrementRouteCounter } from './lib/counters.ts'
import { registry } from './lib/rhizome-registry.ts'
import { logger } from './logger.ts'
import canopyRoutes from './routes/canopy.ts'
import costsRoutes from './routes/costs.ts'
import ecosystemRoutes from './routes/ecosystem.ts'
import hyphaeRoutes from './routes/hyphae.ts'
import lspRoutes from './routes/lsp.ts'
import myceliumRoutes from './routes/mycelium.ts'
import rhizomeRoutes from './routes/rhizome.ts'
import sessionsRoutes from './routes/sessions.ts'
import settingsRoutes from './routes/settings.ts'
import statusRoutes from './routes/status.ts'
import telemetryRoutes from './routes/telemetry.ts'
import usageRoutes from './routes/usage.ts'
import diffRoutes from './routes/diff.ts'
import metricsRoutes from './routes/metrics.ts'
import observerRoutes from './routes/observer.ts'
import statsRoutes from './routes/stats.ts'
import watcherRoutes from './routes/watchers.ts'

// ─────────────────────────────────────────────────────────────────────────────
// API Key Authentication Middleware
// ─────────────────────────────────────────────────────────────────────────────

function getApiKey() {
  return process.env.CAP_API_KEY?.trim() || undefined
}

function isUnauthenticatedDevMode() {
  return process.env.CAP_ALLOW_UNAUTHENTICATED === '1'
}

function isVitestCompatibilityMode() {
  return process.env.VITEST === 'true'
}

function isLocalhostBind(host: string): boolean {
  return host === '127.0.0.1' || host === '::1' || host === 'localhost' || host === '::ffff:127.0.0.1'
}

function createAuthMiddleware(boundHost: string) {
  return async (c: Context, next: Next) => {
    // Health check and client config endpoints are always allowed
    if (c.req.path === '/api/health' || c.req.path === '/api/client-config') {
      await next()
      return
    }

    if (isUnauthenticatedDevMode()) {
      logger.warn('CAP_ALLOW_UNAUTHENTICATED is set — all requests are allowed without authentication')
      await next()
      return
    }

    if (isVitestCompatibilityMode() && process.env.CAP_REQUIRE_AUTH_IN_TESTS !== '1') {
      await next()
      return
    }

    const apiKey = getApiKey()

    if (!apiKey) {
      // No API key configured — check the bound host captured at startup.
      // Localhost-only binds preserve the local-dev experience.
      // Non-loopback binds without an API key block all write/action routes to
      // prevent unauthenticated access on network-exposed instances.
      if (!isLocalhostBind(boundHost)) {
        logger.warn(
          { host: boundHost, method: c.req.method, path: c.req.path },
          'Refusing request on non-loopback bind: CAP_API_KEY is not set'
        )
        return c.json(
          {
            error: 'API key required for non-loopback deployments. Set CAP_API_KEY to enable access.',
          },
          503
        )
      }
      // Localhost bind with no API key — allow (local-dev mode)
      await next()
      return
    }

    // Verify Authorization header for all /api/* endpoints
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      logger.warn({ method: c.req.method, path: c.req.path }, 'Missing Authorization header')
      return c.json({ error: 'Authorization required' }, 401)
    }

    const [scheme, token] = authHeader.split(' ')
    if (scheme !== 'Bearer' || token !== apiKey) {
      logger.warn({ method: c.req.method, path: c.req.path }, 'Invalid API key')
      return c.json({ error: 'Unauthorized' }, 403)
    }

    await next()
  }
}

export function createApp(boundHost = process.env.CAP_HOST ?? '127.0.0.1'): Hono {
  const app = new Hono()

  app.use('*', async (c: Context, next: Next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    logger.info({ method: c.req.method, ms, path: c.req.path, status: c.res.status }, `${c.req.method} ${c.req.path}`)
    const routePrefix = '/' + c.req.path.split('/').slice(1, 3).join('/')
    incrementRouteCounter(routePrefix)
  })

  app.use('*', cors({ origin: CORS_ORIGIN }))
  app.use('/api/*', createAuthMiddleware(boundHost))

  app.onError((err, c) => {
    logger.error({ err, method: c.req.method, path: c.req.path }, 'Request error')
    return c.json({ error: 'Internal server error' }, 500)
  })

  app.route('/api/canopy', canopyRoutes)
  app.route('/api/diff', diffRoutes)
  app.route('/api/cost', costsRoutes)
  app.route('/api/ecosystem', ecosystemRoutes)
  app.route('/api/hyphae', hyphaeRoutes)
  app.route('/api/lsp', lspRoutes)
  app.route('/api/mycelium', myceliumRoutes)
  app.route('/api/sessions', sessionsRoutes)
  app.route('/api/rhizome', rhizomeRoutes)
  app.route('/api/settings', settingsRoutes)
  app.route('/api/metrics', metricsRoutes)
  app.route('/api/observer', observerRoutes)
  app.route('/api/stats', statsRoutes)
  app.route('/api/status', statusRoutes)
  app.route('/api/telemetry', telemetryRoutes)
  app.route('/api/usage', usageRoutes)
  app.route('/api/watchers', watcherRoutes)

  app.get('/api/health', (c) => c.json({ status: 'ok' }))
  app.get('/api/client-config', (c) => c.json({ authRequired: !!getApiKey() }))

  return app
}

export function startServer() {
  const port = Number(process.env.PORT ?? 3001)
  const host = CAP_HOST
  const authMode = isUnauthenticatedDevMode() ? 'explicit-unauthenticated-dev' : 'protected'

  // Create the app with the resolved host so auth middleware closes over the
  // startup value rather than reading env at request time.
  const app = createApp(host)

  logger.info({ apiKeyConfigured: !!getApiKey(), authMode, host, port }, 'Cap server started')
  if (!isLocalhostBind(host) && !getApiKey()) {
    logger.warn(
      { host },
      'CAP_HOST is set beyond localhost but CAP_API_KEY is not configured — ' + 'all write routes are accessible without authentication'
    )
  }
  serve({ fetch: app.fetch, hostname: host, port })
}

if (!process.env.VITEST) {
  startServer()
}

function shutdown() {
  logger.info('Shutting down')
  registry.destroyAll()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
