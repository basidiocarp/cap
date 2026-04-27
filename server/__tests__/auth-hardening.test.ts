import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMock = vi.hoisted(() => ({
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('../logger.ts', () => ({
  logger: loggerMock,
}))

vi.mock('../routes/settings.ts', () => {
  const app = new Hono()

  app.get('/', (c) => c.json({ ok: true }))
  app.post('/', (c) => c.json({ ok: true }))
  app.put('/', (c) => c.json({ ok: true }))
  app.delete('/', (c) => c.json({ ok: true }))

  return { default: app }
})

const previousEnv = {
  allowUnauthenticated: process.env.CAP_ALLOW_UNAUTHENTICATED,
  apiKey: process.env.CAP_API_KEY,
  capHost: process.env.CAP_HOST,
  requireAuthInTests: process.env.CAP_REQUIRE_AUTH_IN_TESTS,
  vitest: process.env.VITEST,
}

function restoreEnv() {
  if (previousEnv.apiKey === undefined) {
    delete process.env.CAP_API_KEY
  } else {
    process.env.CAP_API_KEY = previousEnv.apiKey
  }

  if (previousEnv.allowUnauthenticated === undefined) {
    delete process.env.CAP_ALLOW_UNAUTHENTICATED
  } else {
    process.env.CAP_ALLOW_UNAUTHENTICATED = previousEnv.allowUnauthenticated
  }

  if (previousEnv.vitest === undefined) {
    delete process.env.VITEST
  } else {
    process.env.VITEST = previousEnv.vitest
  }

  if (previousEnv.requireAuthInTests === undefined) {
    delete process.env.CAP_REQUIRE_AUTH_IN_TESTS
  } else {
    process.env.CAP_REQUIRE_AUTH_IN_TESTS = previousEnv.requireAuthInTests
  }

  if (previousEnv.capHost === undefined) {
    delete process.env.CAP_HOST
  } else {
    process.env.CAP_HOST = previousEnv.capHost
  }
}

async function createTestApp(boundHost?: string) {
  vi.resetModules()
  const { createApp } = await import('../index.ts')
  return createApp(boundHost)
}

describe('auth hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    restoreEnv()
  })

  afterEach(() => {
    restoreEnv()
  })

  it('allows protected routes when no API key is configured and bound to localhost (local-dev mode)', async () => {
    delete process.env.CAP_API_KEY
    delete process.env.CAP_ALLOW_UNAUTHENTICATED
    process.env.CAP_REQUIRE_AUTH_IN_TESTS = '1'

    // Pass the bound host directly so the closure captures it at app-creation time
    const app = await createTestApp('127.0.0.1')
    const response = await app.fetch(new Request('http://localhost:3001/api/settings'))

    // Localhost bind + no API key = local-dev pass-through
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('blocks write routes with 503 when no API key is configured and bound to a non-loopback address', async () => {
    delete process.env.CAP_API_KEY
    delete process.env.CAP_ALLOW_UNAUTHENTICATED
    process.env.CAP_REQUIRE_AUTH_IN_TESTS = '1'

    // Pass the non-loopback bound host directly — tests the closure, not the env var
    const app = await createTestApp('0.0.0.0')
    const response = await app.fetch(
      new Request('http://0.0.0.0:3001/api/settings', {
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
    )

    expect(response.status).toBe(503)
    const body = await response.json()
    expect((body as { error: string }).error).toMatch(/CAP_API_KEY/)
  })

  it('blocks GET routes with 503 on a non-loopback bind with no API key', async () => {
    delete process.env.CAP_API_KEY
    delete process.env.CAP_ALLOW_UNAUTHENTICATED
    process.env.CAP_REQUIRE_AUTH_IN_TESTS = '1'

    // Pass the non-loopback bound host directly — tests the closure, not the env var
    const app = await createTestApp('192.168.1.100')
    const response = await app.fetch(new Request('http://192.168.1.100:3001/api/settings'))

    expect(response.status).toBe(503)
    const body = await response.json()
    expect((body as { error: string }).error).toMatch(/CAP_API_KEY/)
  })

  it('allows all routes when CAP_ALLOW_UNAUTHENTICATED=1 overrides even non-loopback bind', async () => {
    delete process.env.CAP_API_KEY
    process.env.CAP_ALLOW_UNAUTHENTICATED = '1'
    process.env.CAP_REQUIRE_AUTH_IN_TESTS = '1'

    // Non-loopback host passed directly; CAP_ALLOW_UNAUTHENTICATED should still override
    const app = await createTestApp('0.0.0.0')
    const response = await app.fetch(new Request('http://localhost:3001/api/settings'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('requires a valid bearer token when the API key is configured', async () => {
    process.env.CAP_API_KEY = 'test-key'
    delete process.env.CAP_ALLOW_UNAUTHENTICATED
    process.env.CAP_REQUIRE_AUTH_IN_TESTS = '1'

    const app = await createTestApp()
    const unauthorizedResponse = await app.fetch(new Request('http://localhost:3001/api/settings'))
    const invalidResponse = await app.fetch(
      new Request('http://localhost:3001/api/settings', {
        headers: { Authorization: 'Bearer wrong-key' },
      })
    )
    const validResponse = await app.fetch(
      new Request('http://localhost:3001/api/settings', {
        headers: { Authorization: 'Bearer test-key' },
      })
    )

    expect(unauthorizedResponse.status).toBe(401)
    await expect(unauthorizedResponse.json()).resolves.toEqual({ error: 'Authorization required' })
    expect(invalidResponse.status).toBe(403)
    await expect(invalidResponse.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(validResponse.status).toBe(200)
    await expect(validResponse.json()).resolves.toEqual({ ok: true })
  })

  it('keeps /api/health public regardless of auth mode', async () => {
    delete process.env.CAP_API_KEY
    delete process.env.CAP_ALLOW_UNAUTHENTICATED
    process.env.CAP_REQUIRE_AUTH_IN_TESTS = '1'

    const app = await createTestApp()
    const publicResponse = await app.fetch(new Request('http://localhost:3001/api/health'))

    expect(publicResponse.status).toBe(200)
    await expect(publicResponse.json()).resolves.toEqual({ status: 'ok' })

    process.env.CAP_ALLOW_UNAUTHENTICATED = '1'
    const overrideApp = await createTestApp()
    const overrideResponse = await overrideApp.fetch(new Request('http://localhost:3001/api/health'))

    expect(overrideResponse.status).toBe(200)
    await expect(overrideResponse.json()).resolves.toEqual({ status: 'ok' })
  })

  it('keeps /api/health public even on a non-loopback bind with no API key', async () => {
    delete process.env.CAP_API_KEY
    delete process.env.CAP_ALLOW_UNAUTHENTICATED
    process.env.CAP_REQUIRE_AUTH_IN_TESTS = '1'

    // Pass non-loopback host directly — health should still be public
    const app = await createTestApp('0.0.0.0')
    const response = await app.fetch(new Request('http://0.0.0.0:3001/api/health'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
  })
})

describe('auth hardening — malformed bodies and blank identity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    restoreEnv()
  })

  afterEach(() => {
    restoreEnv()
  })

  it('returns 400 when settings write body is not a JSON object', async () => {
    // Use the write routes directly (bypassing the mock applied to the full app)
    vi.resetModules()
    const { registerWriteRoutes } = await import('../routes/settings/writes.ts')
    const writeApp = new Hono()
    registerWriteRoutes(writeApp)

    // Malformed: plain string instead of JSON object
    const res = await writeApp.fetch(
      new Request('http://localhost/mycelium', {
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect((body as { error: string }).error).toMatch(/Invalid settings payload/)
  })

  it('returns 400 when settings write has invalid field type', async () => {
    vi.resetModules()
    const { registerWriteRoutes } = await import('../routes/settings/writes.ts')
    const writeApp = new Hono()
    registerWriteRoutes(writeApp)

    // hyphae_enabled must be a boolean, not a string
    const res = await writeApp.fetch(
      new Request('http://localhost/mycelium', {
        body: JSON.stringify({ hyphae_enabled: 'yes' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect((body as { error: string }).error).toMatch(/hyphae_enabled/)
  })

  it('returns 400 when rhizome settings write has blank language entry', async () => {
    vi.resetModules()
    const { registerWriteRoutes } = await import('../routes/settings/writes.ts')
    const writeApp = new Hono()
    registerWriteRoutes(writeApp)

    // Blank string in languages array is rejected
    const res = await writeApp.fetch(
      new Request('http://localhost/rhizome', {
        body: JSON.stringify({ languages: ['rust', ''] }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
      })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect((body as { error: string }).error).toMatch(/non-empty/)
  })
})
