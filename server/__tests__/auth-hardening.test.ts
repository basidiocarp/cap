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

  return { default: app }
})

const previousEnv = {
  allowUnauthenticated: process.env.CAP_ALLOW_UNAUTHENTICATED,
  apiKey: process.env.CAP_API_KEY,
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
}

async function createTestApp() {
  vi.resetModules()
  const { createApp } = await import('../index.ts')
  return createApp()
}

describe('auth hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    restoreEnv()
  })

  afterEach(() => {
    restoreEnv()
  })

  it('rejects protected routes when the API key is missing and no override is set', async () => {
    delete process.env.CAP_API_KEY
    delete process.env.CAP_ALLOW_UNAUTHENTICATED
    process.env.CAP_REQUIRE_AUTH_IN_TESTS = '1'

    const app = await createTestApp()
    const response = await app.fetch(new Request('http://localhost:3001/api/settings'))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'API key required' })
  })

  it('allows protected routes when explicit unauthenticated mode is enabled', async () => {
    delete process.env.CAP_API_KEY
    process.env.CAP_ALLOW_UNAUTHENTICATED = '1'
    process.env.CAP_REQUIRE_AUTH_IN_TESTS = '1'

    const app = await createTestApp()
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
})
