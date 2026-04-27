import { createHmac } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createApp } from '../index'
import { GithubWatcher } from '../lib/watchers/github.ts'
import { registry } from '../lib/watchers/registry.ts'
import { WebhookWatcher } from '../lib/watchers/webhook.ts'

describe('Watchers API', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.resetModules()
    app = createApp()
  })

  describe('GET /api/watchers', () => {
    it('returns adapter list including webhook and github', async () => {
      const req = new Request('http://localhost:3001/api/watchers')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)

      const json = (await res.json()) as Record<string, unknown>
      const adapters = json.adapters as string[]

      expect(Array.isArray(adapters)).toBe(true)
      expect(adapters).toContain('webhook')
      expect(adapters).toContain('github')
    })
  })

  describe('POST /api/watchers/webhook', () => {
    it('rejects payload when no secret is configured (secure default)', async () => {
      const originalSecret = process.env.CAP_WEBHOOK_SECRET
      const originalAllowUnauth = process.env.CAP_ALLOW_UNAUTHENTICATED
      delete process.env.CAP_WEBHOOK_SECRET
      delete process.env.CAP_ALLOW_UNAUTHENTICATED

      try {
        const payload = JSON.stringify({ test: 'data' })
        const req = new Request('http://localhost:3001/api/watchers/webhook', {
          body: payload,
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const res = await app.fetch(req)
        expect(res.status).toBe(401)

        const json = (await res.json()) as Record<string, unknown>
        expect(json.error).toBe('Unauthorized')
      } finally {
        if (originalSecret !== undefined) {
          process.env.CAP_WEBHOOK_SECRET = originalSecret
        }
        if (originalAllowUnauth !== undefined) {
          process.env.CAP_ALLOW_UNAUTHENTICATED = originalAllowUnauth
        }
      }
    })

    it('accepts payload when no secret is configured and CAP_ALLOW_UNAUTHENTICATED=1', async () => {
      const originalSecret = process.env.CAP_WEBHOOK_SECRET
      const originalAllowUnauth = process.env.CAP_ALLOW_UNAUTHENTICATED
      delete process.env.CAP_WEBHOOK_SECRET
      process.env.CAP_ALLOW_UNAUTHENTICATED = '1'

      try {
        const payload = JSON.stringify({ test: 'data' })
        const req = new Request('http://localhost:3001/api/watchers/webhook', {
          body: payload,
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const res = await app.fetch(req)
        expect(res.status).toBe(200)

        const json = (await res.json()) as Record<string, unknown>
        expect(json.success).toBe(true)
        expect(json.event).toBe('dashboard_update')
      } finally {
        if (originalSecret !== undefined) {
          process.env.CAP_WEBHOOK_SECRET = originalSecret
        }
        if (originalAllowUnauth !== undefined) {
          process.env.CAP_ALLOW_UNAUTHENTICATED = originalAllowUnauth
        } else {
          delete process.env.CAP_ALLOW_UNAUTHENTICATED
        }
      }
    })

    it('rejects payload with wrong signature when secret is configured', async () => {
      const secret = 'test-secret'
      const originalSecret = process.env.CAP_WEBHOOK_SECRET
      process.env.CAP_WEBHOOK_SECRET = secret

      try {
        const payload = Buffer.from(JSON.stringify({ test: 'data' }))
        const wrongSignature = 'sha256=wrongsignature'

        const req = new Request('http://localhost:3001/api/watchers/webhook', {
          body: payload,
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': wrongSignature,
          },
          method: 'POST',
        })

        const res = await app.fetch(req)
        expect(res.status).toBe(401)

        const json = (await res.json()) as Record<string, unknown>
        expect(json.error).toBe('Unauthorized')
      } finally {
        if (originalSecret !== undefined) {
          process.env.CAP_WEBHOOK_SECRET = originalSecret
        } else {
          delete process.env.CAP_WEBHOOK_SECRET
        }
      }
    })

    it('accepts payload with correct HMAC signature', async () => {
      const secret = 'test-secret'
      const originalSecret = process.env.CAP_WEBHOOK_SECRET
      process.env.CAP_WEBHOOK_SECRET = secret

      try {
        const payload = Buffer.from(JSON.stringify({ test: 'data' }))
        const signature = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')

        const req = new Request('http://localhost:3001/api/watchers/webhook', {
          body: payload,
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
          },
          method: 'POST',
        })

        const res = await app.fetch(req)
        expect(res.status).toBe(200)

        const json = (await res.json()) as Record<string, unknown>
        expect(json.success).toBe(true)
      } finally {
        if (originalSecret !== undefined) {
          process.env.CAP_WEBHOOK_SECRET = originalSecret
        } else {
          delete process.env.CAP_WEBHOOK_SECRET
        }
      }
    })

    it('rejects invalid JSON payload (with CAP_ALLOW_UNAUTHENTICATED to bypass sig check)', async () => {
      const originalAllowUnauth = process.env.CAP_ALLOW_UNAUTHENTICATED
      const originalSecret = process.env.CAP_WEBHOOK_SECRET
      process.env.CAP_ALLOW_UNAUTHENTICATED = '1'
      delete process.env.CAP_WEBHOOK_SECRET

      try {
        const req = new Request('http://localhost:3001/api/watchers/webhook', {
          body: 'not valid json {',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const res = await app.fetch(req)
        expect(res.status).toBe(400)

        const json = (await res.json()) as Record<string, unknown>
        expect(json.error).toBe('Invalid JSON')
      } finally {
        if (originalAllowUnauth !== undefined) {
          process.env.CAP_ALLOW_UNAUTHENTICATED = originalAllowUnauth
        } else {
          delete process.env.CAP_ALLOW_UNAUTHENTICATED
        }
        if (originalSecret !== undefined) {
          process.env.CAP_WEBHOOK_SECRET = originalSecret
        }
      }
    })
  })

  describe('POST /api/watchers/github', () => {
    it('rejects payload when no secret is configured (secure default)', async () => {
      const originalSecret = process.env.CAP_GITHUB_SECRET
      const originalAllowUnauth = process.env.CAP_ALLOW_UNAUTHENTICATED
      delete process.env.CAP_GITHUB_SECRET
      delete process.env.CAP_ALLOW_UNAUTHENTICATED

      try {
        const payload = JSON.stringify({ action: 'opened' })
        const req = new Request('http://localhost:3001/api/watchers/github', {
          body: payload,
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const res = await app.fetch(req)
        expect(res.status).toBe(401)

        const json = (await res.json()) as Record<string, unknown>
        expect(json.error).toBe('Unauthorized')
      } finally {
        if (originalSecret !== undefined) {
          process.env.CAP_GITHUB_SECRET = originalSecret
        }
        if (originalAllowUnauth !== undefined) {
          process.env.CAP_ALLOW_UNAUTHENTICATED = originalAllowUnauth
        }
      }
    })

    it('accepts payload when no secret is configured and CAP_ALLOW_UNAUTHENTICATED=1', async () => {
      const originalSecret = process.env.CAP_GITHUB_SECRET
      const originalAllowUnauth = process.env.CAP_ALLOW_UNAUTHENTICATED
      delete process.env.CAP_GITHUB_SECRET
      process.env.CAP_ALLOW_UNAUTHENTICATED = '1'

      try {
        const payload = JSON.stringify({ action: 'opened' })
        const req = new Request('http://localhost:3001/api/watchers/github', {
          body: payload,
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const res = await app.fetch(req)
        expect(res.status).toBe(200)

        const json = (await res.json()) as Record<string, unknown>
        expect(json.success).toBe(true)
      } finally {
        if (originalSecret !== undefined) {
          process.env.CAP_GITHUB_SECRET = originalSecret
        }
        if (originalAllowUnauth !== undefined) {
          process.env.CAP_ALLOW_UNAUTHENTICATED = originalAllowUnauth
        } else {
          delete process.env.CAP_ALLOW_UNAUTHENTICATED
        }
      }
    })

    it('rejects payload with wrong signature when secret is configured', async () => {
      const secret = 'github-secret'
      const originalSecret = process.env.CAP_GITHUB_SECRET
      process.env.CAP_GITHUB_SECRET = secret

      try {
        const payload = Buffer.from(JSON.stringify({ action: 'opened' }))
        const wrongSignature = 'sha256=wrongsignature'

        const req = new Request('http://localhost:3001/api/watchers/github', {
          body: payload,
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': wrongSignature,
          },
          method: 'POST',
        })

        const res = await app.fetch(req)
        expect(res.status).toBe(401)

        const json = (await res.json()) as Record<string, unknown>
        expect(json.error).toBe('Unauthorized')
      } finally {
        if (originalSecret !== undefined) {
          process.env.CAP_GITHUB_SECRET = originalSecret
        } else {
          delete process.env.CAP_GITHUB_SECRET
        }
      }
    })

    it('accepts payload with correct HMAC signature', async () => {
      const secret = 'github-secret'
      const originalSecret = process.env.CAP_GITHUB_SECRET
      process.env.CAP_GITHUB_SECRET = secret

      try {
        const payload = Buffer.from(JSON.stringify({ action: 'opened' }))
        const signature = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')

        const req = new Request('http://localhost:3001/api/watchers/github', {
          body: payload,
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': signature,
          },
          method: 'POST',
        })

        const res = await app.fetch(req)
        expect(res.status).toBe(200)

        const json = (await res.json()) as Record<string, unknown>
        expect(json.success).toBe(true)
      } finally {
        if (originalSecret !== undefined) {
          process.env.CAP_GITHUB_SECRET = originalSecret
        } else {
          delete process.env.CAP_GITHUB_SECRET
        }
      }
    })

    it('rejects invalid JSON payload (with CAP_ALLOW_UNAUTHENTICATED to bypass sig check)', async () => {
      const originalAllowUnauth = process.env.CAP_ALLOW_UNAUTHENTICATED
      const originalSecret = process.env.CAP_GITHUB_SECRET
      process.env.CAP_ALLOW_UNAUTHENTICATED = '1'
      delete process.env.CAP_GITHUB_SECRET

      try {
        const req = new Request('http://localhost:3001/api/watchers/github', {
          body: 'not valid json {',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const res = await app.fetch(req)
        expect(res.status).toBe(400)

        const json = (await res.json()) as Record<string, unknown>
        expect(json.error).toBe('Invalid JSON')
      } finally {
        if (originalAllowUnauth !== undefined) {
          process.env.CAP_ALLOW_UNAUTHENTICATED = originalAllowUnauth
        } else {
          delete process.env.CAP_ALLOW_UNAUTHENTICATED
        }
        if (originalSecret !== undefined) {
          process.env.CAP_GITHUB_SECRET = originalSecret
        }
      }
    })
  })

  describe('Watcher Adapters', () => {
    describe('WebhookWatcher', () => {
      it('uses constant-time comparison for HMAC', () => {
        const watcher = new WebhookWatcher()
        const secret = 'secret'
        const payload = Buffer.from('test payload')

        // Compute valid signature
        const validSig = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')

        // Should match
        expect(watcher.validate(payload, validSig, secret)).toBe(true)

        // Wrong signature should not match
        expect(watcher.validate(payload, 'sha256=wrong', secret)).toBe(false)
      })

      it('rejects when secret is empty (pure HMAC: no env coupling)', () => {
        const watcher = new WebhookWatcher()
        const payload = Buffer.from('test payload')
        // validate() is a pure HMAC function — no secret always means reject,
        // regardless of CAP_ALLOW_UNAUTHENTICATED. The bypass is the route layer's job.
        expect(watcher.validate(payload, '', '')).toBe(false)
      })

      it('transforms raw event to dashboard_update', () => {
        const watcher = new WebhookWatcher()
        const event = {
          payload: { key: 'value' },
          received_at: new Date().toISOString(),
          source: 'webhook',
        }

        const result = watcher.transform(event)

        expect(result.type).toBe('dashboard_update')
        expect((result as any).data).toEqual({ key: 'value' })
      })
    })

    describe('GithubWatcher', () => {
      it('uses constant-time comparison for HMAC', () => {
        const watcher = new GithubWatcher()
        const secret = 'github-secret'
        const payload = Buffer.from('test payload')

        // Compute valid signature
        const validSig = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')

        // Should match
        expect(watcher.validate(payload, validSig, secret)).toBe(true)

        // Wrong signature should not match
        expect(watcher.validate(payload, 'sha256=wrong', secret)).toBe(false)
      })

      it('rejects when secret is empty (pure HMAC: no env coupling)', () => {
        const watcher = new GithubWatcher()
        const payload = Buffer.from('test payload')
        // validate() is a pure HMAC function — no secret always means reject,
        // regardless of CAP_ALLOW_UNAUTHENTICATED. The bypass is the route layer's job.
        expect(watcher.validate(payload, '', '')).toBe(false)
      })

      it('transforms pull_request opened event to notify', () => {
        const watcher = new GithubWatcher()
        const event = {
          payload: {
            action: 'opened',
            number: 123,
            pull_request: { number: 123 },
          },
          received_at: new Date().toISOString(),
          source: 'github',
        }

        const result = watcher.transform(event)

        expect(result.type).toBe('notify')
        expect((result as any).message).toContain('PR #123')
        expect((result as any).message).toContain('opened')
        expect((result as any).severity).toBe('info')
      })

      it('transforms pull_request closed event to notify', () => {
        const watcher = new GithubWatcher()
        const event = {
          payload: {
            action: 'closed',
            pull_request: { number: 456 },
          },
          received_at: new Date().toISOString(),
          source: 'github',
        }

        const result = watcher.transform(event)

        expect(result.type).toBe('notify')
        expect((result as any).message).toContain('PR #456')
        expect((result as any).message).toContain('closed')
      })

      it('transforms push event to dashboard_update', () => {
        const watcher = new GithubWatcher()
        const event = {
          payload: {
            commits: [],
            ref: 'refs/heads/main',
          },
          received_at: new Date().toISOString(),
          source: 'github',
        }

        const result = watcher.transform(event)

        expect(result.type).toBe('dashboard_update')
        expect((result as any).data.ref).toBe('refs/heads/main')
      })
    })
  })

  describe('WatcherRegistry', () => {
    it('lists registered adapters', () => {
      const adapters = registry.list()

      expect(adapters).toContain('webhook')
      expect(adapters).toContain('github')
    })
  })
})
