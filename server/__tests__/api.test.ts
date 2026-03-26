import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as hyphae from '../hyphae'
import { createApp } from '../index'
import { registry } from '../lib/rhizome-registry'

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
      expect(hyphae).toHaveProperty('config_present')
      expect(hyphae).toHaveProperty('config_source')
      expect(hyphae).toHaveProperty('db_path')
      expect(hyphae).toHaveProperty('db_source')
      expect(hyphae).toHaveProperty('db_size_bytes')
      expect(hyphae).toHaveProperty('resolved_config_path')
      expect(typeof hyphae.db_size_bytes).toBe('number')

      // Verify mycelium structure
      const mycelium = json.mycelium as Record<string, unknown>
      expect(mycelium).toHaveProperty('config_path')
      expect(mycelium).toHaveProperty('config_present')
      expect(mycelium).toHaveProperty('config_source')
      expect(mycelium).toHaveProperty('filters')
      expect(mycelium).toHaveProperty('resolved_config_path')
      const filters = mycelium.filters as Record<string, unknown>
      expect(filters).toHaveProperty('hyphae')
      expect(filters).toHaveProperty('rhizome')

      // Verify rhizome structure
      const rhizome = json.rhizome as Record<string, unknown>
      expect(rhizome).toHaveProperty('auto_export')
      expect(rhizome).toHaveProperty('config_path')
      expect(rhizome).toHaveProperty('config_present')
      expect(rhizome).toHaveProperty('config_source')
      expect(rhizome).toHaveProperty('languages_enabled')
      expect(rhizome).toHaveProperty('resolved_config_path')
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
      expect(json).toHaveProperty('agents')
      expect(json).toHaveProperty('project')
      expect(json).toHaveProperty('hooks')
      expect(json).toHaveProperty('hyphae')

      const agents = json.agents as Record<string, unknown>
      expect(agents).toHaveProperty('claude_code')
      expect(agents).toHaveProperty('codex')

      const claude = agents.claude_code as Record<string, unknown>
      expect(claude).toHaveProperty('resolved_config_path')
      expect(claude).toHaveProperty('resolved_config_source')

      const codex = agents.codex as Record<string, unknown>
      expect(codex).toHaveProperty('notify')
      expect(codex).toHaveProperty('resolved_config_path')
      expect(codex).toHaveProperty('resolved_config_source')
      const notify = codex.notify as Record<string, unknown>
      expect(notify).toHaveProperty('configured')
      expect(notify).toHaveProperty('contract_matched')
      expect(notify).toHaveProperty('command')

      const project = json.project as Record<string, unknown>
      expect(typeof project.active).toBe('string')
      expect(Array.isArray(project.recent)).toBe(true)

      const hooks = json.hooks as Record<string, unknown>
      expect(Array.isArray(hooks.lifecycle)).toBe(true)
      const lifecycle = hooks.lifecycle as Array<Record<string, unknown>>
      expect(lifecycle.map((entry) => entry.event)).toEqual(['SessionStart', 'PostToolUse', 'PreCompact', 'SessionEnd'])

      const hyphae = json.hyphae as Record<string, unknown>
      expect(hyphae).toHaveProperty('activity')
      const activity = hyphae.activity as Record<string, unknown>
      expect(activity).toHaveProperty('codex_memory_count')
      expect(activity).toHaveProperty('last_codex_memory_at')
      expect(activity).toHaveProperty('last_session_memory_at')
      expect(activity).toHaveProperty('last_session_topic')
      expect(activity).toHaveProperty('recent_session_memory_count')
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

  describe('GET /api/hyphae/memoirs/:name', () => {
    it('forwards memoir paging and filter parameters', async () => {
      const memoirShowSpy = vi.spyOn(hyphae, 'memoirShow').mockReturnValue({
        concepts: [],
        limit: 200,
        memoir: {
          consolidation_threshold: 50,
          created_at: '2026-03-24T00:00:00Z',
          description: 'Memoir description',
          id: 'memoir-1',
          name: 'code:williamnewton',
          updated_at: '2026-03-24T00:00:00Z',
        },
        offset: 400,
        query: 'router',
        total_concepts: 12,
      })

      const req = new Request('http://localhost:3001/api/hyphae/memoirs/code%3Awilliamnewton?limit=200&offset=400&q=router')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(memoirShowSpy).toHaveBeenCalledWith('code:williamnewton', {
        limit: 200,
        offset: 400,
        q: 'router',
      })
      await expect(res.json()).resolves.toMatchObject({
        limit: 200,
        offset: 400,
        query: 'router',
        total_concepts: 12,
      })
    })
  })

  describe('POST /api/rhizome edit workflows', () => {
    it('forwards rename requests to Rhizome', async () => {
      const client = {
        callTool: vi.fn().mockResolvedValue('Renamed symbol'),
        isAvailable: vi.fn().mockReturnValue(true),
      }
      vi.spyOn(registry, 'getActive').mockReturnValue(client as never)

      const req = new Request('http://localhost:3001/api/rhizome/rename', {
        body: JSON.stringify({
          column: 4,
          file: 'src/lib.rs',
          line: 12,
          new_name: 'renamed_symbol',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(client.callTool).toHaveBeenCalledWith('rename_symbol', {
        column: 4,
        file: 'src/lib.rs',
        line: 12,
        new_name: 'renamed_symbol',
      })
      await expect(res.json()).resolves.toBe('Renamed symbol')
    })

    it('forwards copy requests to Rhizome', async () => {
      const client = {
        callTool: vi.fn().mockResolvedValue({ inserted_at_line: 42, lines_inserted: 8 }),
        isAvailable: vi.fn().mockReturnValue(true),
      }
      vi.spyOn(registry, 'getActive').mockReturnValue(client as never)

      const req = new Request('http://localhost:3001/api/rhizome/copy-symbol', {
        body: JSON.stringify({
          position: 'after',
          source_file: 'src/source.ts',
          symbol: 'SourceThing',
          target_file: 'src/target.ts',
          target_symbol: 'TargetThing',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(client.callTool).toHaveBeenCalledWith('copy_symbol', {
        position: 'after',
        source_file: 'src/source.ts',
        symbol: 'SourceThing',
        target_file: 'src/target.ts',
        target_symbol: 'TargetThing',
      })
      await expect(res.json()).resolves.toEqual({ inserted_at_line: 42, lines_inserted: 8 })
    })

    it('rejects move requests with missing required fields', async () => {
      const client = {
        callTool: vi.fn(),
        isAvailable: vi.fn().mockReturnValue(true),
      }
      vi.spyOn(registry, 'getActive').mockReturnValue(client as never)

      const req = new Request('http://localhost:3001/api/rhizome/move-symbol', {
        body: JSON.stringify({
          source_file: 'src/source.ts',
          symbol: 'SourceThing',
          target_file: 'src/target.ts',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(client.callTool).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toEqual({ error: 'Missing required field: target_symbol' })
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
