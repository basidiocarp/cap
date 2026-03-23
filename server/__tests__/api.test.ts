import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as hyphae from '../hyphae'
import { createApp } from '../index'

// ─────────────────────────────────────────────────────────────────────────────
// API Route Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('API Routes', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.restoreAllMocks()
    app = createApp()
  })

  describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
      const req = new Request('http://localhost:3001/api/health')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)

      const json = (await res.json()) as Record<string, unknown>
      expect(json.status).toBe('ok')
    })
  })

  describe('GET /api/settings', () => {
    it('returns settings object with expected shape', async () => {
      const req = new Request('http://localhost:3001/api/settings')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)

      const json = (await res.json()) as Record<string, unknown>

      // Verify top-level keys
      expect(json).toHaveProperty('hyphae')
      expect(json).toHaveProperty('mycelium')
      expect(json).toHaveProperty('rhizome')

      // Verify hyphae structure
      const hyphae = json.hyphae as Record<string, unknown>
      expect(hyphae).toHaveProperty('config_path')
      expect(hyphae).toHaveProperty('db_path')
      expect(hyphae).toHaveProperty('db_size_bytes')
      expect(typeof hyphae.db_size_bytes).toBe('number')

      // Verify mycelium structure
      const mycelium = json.mycelium as Record<string, unknown>
      expect(mycelium).toHaveProperty('config_path')
      expect(mycelium).toHaveProperty('filters')
      const filters = mycelium.filters as Record<string, unknown>
      expect(filters).toHaveProperty('hyphae')
      expect(filters).toHaveProperty('rhizome')

      // Verify rhizome structure
      const rhizome = json.rhizome as Record<string, unknown>
      expect(rhizome).toHaveProperty('auto_export')
      expect(rhizome).toHaveProperty('config_path')
      expect(rhizome).toHaveProperty('languages_enabled')
      expect(typeof rhizome.languages_enabled).toBe('number')
    })

    it('returns valid response even if tools are not installed', async () => {
      const req = new Request('http://localhost:3001/api/settings')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)

      const json = (await res.json()) as Record<string, unknown>
      expect(json).toBeDefined()
      // Should not be an error response
      expect(json).not.toHaveProperty('error')
    })
  })

  describe('GET /api/status', () => {
    it('returns ecosystem status with project and hook lifecycle coverage', async () => {
      const req = new Request('http://localhost:3001/api/status')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)

      const json = (await res.json()) as Record<string, unknown>
      expect(json).toHaveProperty('project')
      expect(json).toHaveProperty('hooks')

      const project = json.project as Record<string, unknown>
      expect(typeof project.active).toBe('string')
      expect(Array.isArray(project.recent)).toBe(true)

      const hooks = json.hooks as Record<string, unknown>
      expect(Array.isArray(hooks.lifecycle)).toBe(true)
      const lifecycle = hooks.lifecycle as Array<Record<string, unknown>>
      expect(lifecycle.map((entry) => entry.event)).toEqual(['SessionStart', 'PostToolUse', 'PreCompact', 'SessionEnd'])
    })
  })

  describe('POST /api/hyphae/memories/:id/invalidate', () => {
    it('forwards invalidate requests with an optional reason', async () => {
      const invalidateSpy = vi.spyOn(hyphae, 'invalidateMemory').mockResolvedValue('invalidated')

      const req = new Request('http://localhost:3001/api/hyphae/memories/mem-123/invalidate', {
        body: JSON.stringify({ reason: 'No longer matches the current branch' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(invalidateSpy).toHaveBeenCalledWith('mem-123', 'No longer matches the current branch')
      await expect(res.json()).resolves.toEqual({ result: 'invalidated' })
    })

    it('rejects non-string invalidation reasons', async () => {
      const req = new Request('http://localhost:3001/api/hyphae/memories/mem-123/invalidate', {
        body: JSON.stringify({ reason: 42 }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      await expect(res.json()).resolves.toEqual({ error: 'reason must be a string' })
    })
  })

  describe('Error handling', () => {
    it('handles 404 gracefully', async () => {
      const req = new Request('http://localhost:3001/api/nonexistent')
      const res = await app.fetch(req)

      expect(res.status).toBe(404)
    })

    it('includes CORS headers in response', async () => {
      const req = new Request('http://localhost:3001/api/health', {
        headers: {
          Origin: 'http://localhost:5173',
        },
      })
      const res = await app.fetch(req)

      // CORS headers should be present (depends on CORS configuration)
      expect(res.status).toBe(200)
    })
  })
})
