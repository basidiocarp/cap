import { Hono } from 'hono'

import { getStatus } from './status/checks.ts'

// ComponentStatus is the shared shape for all /api/observer/* responses.
// Contract: septa/cap-observer-status-v1.schema.json
interface ComponentStatus {
  is_healthy: boolean
  has_errors: boolean
  status: string
  last_check_ms?: number
}

const app = new Hono()

app.get('/hyphae', async (c) => {
  const start = Date.now()
  const s = await getStatus()
  const available = s.hyphae.available
  return c.json<ComponentStatus>({
    has_errors: !available,
    is_healthy: available,
    last_check_ms: Date.now() - start,
    status: available ? 'ok' : 'unavailable',
  })
})

app.get('/mycelium', async (c) => {
  const start = Date.now()
  const s = await getStatus()
  const available = s.mycelium.available
  return c.json<ComponentStatus>({
    has_errors: !available,
    is_healthy: available,
    last_check_ms: Date.now() - start,
    status: available ? 'ok' : 'unavailable',
  })
})

app.get('/rhizome', async (c) => {
  const start = Date.now()
  const s = await getStatus()
  const available = s.rhizome.available
  return c.json<ComponentStatus>({
    has_errors: !available,
    is_healthy: available,
    last_check_ms: Date.now() - start,
    status: available ? 'ok' : 'unavailable',
  })
})

app.get('/canopy', async (c) => {
  const start = Date.now()
  const s = await getStatus()
  // Canopy is considered available when the agent runtime is detected or configured.
  const available = s.agents.claude_code.detected || s.agents.claude_code.configured
  return c.json<ComponentStatus>({
    has_errors: !available,
    is_healthy: available,
    last_check_ms: Date.now() - start,
    status: available ? 'ok' : 'unavailable',
  })
})

app.get('/system', async (c) => {
  const start = Date.now()
  const s = await getStatus()
  const components = [s.hyphae.available, s.mycelium.available, s.rhizome.available]
  const allHealthy = components.every(Boolean)
  const anyErrors = components.some((v) => !v)
  return c.json<ComponentStatus>({
    has_errors: anyErrors,
    is_healthy: allHealthy,
    last_check_ms: Date.now() - start,
    status: allHealthy ? 'all components healthy' : 'one or more components unavailable',
  })
})

export default app
