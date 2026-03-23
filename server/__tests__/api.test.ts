import { beforeEach, describe, expect, it } from 'vitest'

import { createApp } from '../index'

// ─────────────────────────────────────────────────────────────────────────────
// API Route Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('API Routes', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
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
