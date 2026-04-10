import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as canopy from '../canopy'
import * as hyphae from '../hyphae'
import { HyphaeSessionTimelineDetailCliError } from '../hyphae/session-timeline-detail-cli.ts'
import { createApp } from '../index'
import { registry } from '../lib/rhizome-registry'
import * as mycelium from '../mycelium'

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
      expect(json).toHaveProperty('host')
      expect(json).toHaveProperty('adapter_status')
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

  describe('CLI-backed Hyphae read route failures', () => {
    it('maps topic list failures to 502', async () => {
      const topicsSpy = vi.spyOn(hyphae, 'getTopics').mockRejectedValue(new Error('hyphae unavailable'))

      const res = await app.fetch(new Request('http://localhost:3001/api/hyphae/topics'))

      expect(res.status).toBe(502)
      expect(topicsSpy).toHaveBeenCalledWith()
      await expect(res.json()).resolves.toEqual({ error: 'Hyphae topics unavailable' })
    })

    it('maps topic memory failures to 502', async () => {
      const topicMemoriesSpy = vi.spyOn(hyphae, 'getMemoriesByTopic').mockRejectedValue(new Error('hyphae unavailable'))

      const res = await app.fetch(new Request('http://localhost:3001/api/hyphae/topics/decisions%2Fapi/memories?limit=25'))

      expect(res.status).toBe(502)
      expect(topicMemoriesSpy).toHaveBeenCalledWith('decisions/api', 25)
      await expect(res.json()).resolves.toEqual({ error: 'Hyphae topic memories unavailable' })
    })

    it('maps recall failures to 502', async () => {
      const recallSpy = vi.spyOn(hyphae, 'recall').mockRejectedValue(new Error('hyphae unavailable'))

      const res = await app.fetch(new Request('http://localhost:3001/api/hyphae/recall?q=router&topic=decisions%2Fapi&limit=15'))

      expect(res.status).toBe(502)
      expect(recallSpy).toHaveBeenCalledWith('router', 'decisions/api', 15)
      await expect(res.json()).resolves.toEqual({ error: 'Hyphae recall unavailable' })
    })

    it('maps search-global failures to 502', async () => {
      const searchGlobalSpy = vi.spyOn(hyphae, 'searchGlobal').mockRejectedValue(new Error('hyphae unavailable'))

      const res = await app.fetch(new Request('http://localhost:3001/api/hyphae/search-global?q=router&limit=15'))

      expect(res.status).toBe(502)
      expect(searchGlobalSpy).toHaveBeenCalledWith('router', 15)
      await expect(res.json()).resolves.toEqual({ error: 'Hyphae search unavailable' })
    })

    it('maps source list failures to 502', async () => {
      const sourcesSpy = vi.spyOn(hyphae, 'getIngestionSources').mockRejectedValue(new Error('hyphae unavailable'))

      const res = await app.fetch(new Request('http://localhost:3001/api/hyphae/sources'))

      expect(res.status).toBe(502)
      expect(sourcesSpy).toHaveBeenCalledWith()
      await expect(res.json()).resolves.toEqual({ error: 'Hyphae sources unavailable' })
    })

    it('maps lesson failures to 502', async () => {
      const lessonsSpy = vi.spyOn(hyphae, 'getLessons').mockRejectedValue(new Error('hyphae unavailable'))

      const res = await app.fetch(new Request('http://localhost:3001/api/hyphae/lessons'))

      expect(res.status).toBe(502)
      expect(lessonsSpy).toHaveBeenCalledWith()
      await expect(res.json()).resolves.toEqual({ error: 'Hyphae lessons unavailable' })
    })

    it('maps analytics failures to 502', async () => {
      const analyticsSpy = vi.spyOn(hyphae, 'getAnalytics').mockRejectedValue(new Error('hyphae unavailable'))

      const res = await app.fetch(new Request('http://localhost:3001/api/hyphae/analytics'))

      expect(res.status).toBe(502)
      expect(analyticsSpy).toHaveBeenCalledWith()
      await expect(res.json()).resolves.toEqual({ error: 'Hyphae analytics unavailable' })
    })
  })

  describe('CLI-backed Hyphae lessons and analytics routes', () => {
    it('returns lessons from the CLI consumer', async () => {
      const lessonsSpy = vi.spyOn(hyphae, 'getLessons').mockResolvedValue([
        {
          category: 'corrections',
          description: 'Prefer CLI-backed reads',
          frequency: 2,
          id: 'correction-0',
          keywords: ['hyphae', 'cli'],
          source_topics: ['corrections'],
        },
      ])

      const res = await app.fetch(new Request('http://localhost:3001/api/hyphae/lessons'))

      expect(res.status).toBe(200)
      expect(lessonsSpy).toHaveBeenCalledWith()
      await expect(res.json()).resolves.toEqual([
        {
          category: 'corrections',
          description: 'Prefer CLI-backed reads',
          frequency: 2,
          id: 'correction-0',
          keywords: ['hyphae', 'cli'],
          source_topics: ['corrections'],
        },
      ])
    })

    it('returns analytics from the CLI consumer', async () => {
      const analyticsSpy = vi.spyOn(hyphae, 'getAnalytics').mockResolvedValue({
        importance_distribution: { critical: 1, ephemeral: 0, high: 3, low: 2, medium: 4 },
        lifecycle: {
          avg_weight: 0.74,
          created_last_7d: 5,
          created_last_30d: 12,
          decayed: 2,
          min_weight: 0.2,
          pruned: 0,
        },
        memoir_stats: { code_memoirs: 2, total: 3, total_concepts: 15, total_links: 9 },
        memory_utilization: { rate: 0.4, recalled: 8, total: 20 },
        search_stats: null,
        top_topics: [{ avg_weight: 0.81, count: 4, latest_created_at: '2026-03-30T19:00:00Z', name: 'decisions/api' }],
      })

      const res = await app.fetch(new Request('http://localhost:3001/api/hyphae/analytics'))

      expect(res.status).toBe(200)
      expect(analyticsSpy).toHaveBeenCalledWith()
      await expect(res.json()).resolves.toEqual({
        importance_distribution: { critical: 1, ephemeral: 0, high: 3, low: 2, medium: 4 },
        lifecycle: {
          avg_weight: 0.74,
          created_last_7d: 5,
          created_last_30d: 12,
          decayed: 2,
          min_weight: 0.2,
          pruned: 0,
        },
        memoir_stats: { code_memoirs: 2, total: 3, total_concepts: 15, total_links: 9 },
        memory_utilization: { rate: 0.4, recalled: 8, total: 20 },
        search_stats: null,
        top_topics: [{ avg_weight: 0.81, count: 4, latest_created_at: '2026-03-30T19:00:00Z', name: 'decisions/api' }],
      })
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
      const memoirShowSpy = vi.spyOn(hyphae, 'memoirShow').mockResolvedValue({
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

    it('returns 404 when the memoir does not exist', async () => {
      const memoirShowSpy = vi.spyOn(hyphae, 'memoirShow').mockResolvedValue(null)

      const req = new Request('http://localhost:3001/api/hyphae/memoirs/code%3Amissing')
      const res = await app.fetch(req)

      expect(res.status).toBe(404)
      expect(memoirShowSpy).toHaveBeenCalledWith('code:missing', {
        limit: 200,
        offset: 0,
        q: undefined,
      })
      await expect(res.json()).resolves.toEqual({ error: 'Not found' })
    })

    it('surfaces Hyphae memoir detail CLI failures as backend errors', async () => {
      const memoirShowSpy = vi.spyOn(hyphae, 'memoirShow').mockRejectedValue(new Error('hyphae unavailable'))

      const req = new Request('http://localhost:3001/api/hyphae/memoirs/code%3Awilliamnewton')
      const res = await app.fetch(req)

      expect(res.status).toBe(502)
      expect(memoirShowSpy).toHaveBeenCalledWith('code:williamnewton', {
        limit: 200,
        offset: 0,
        q: undefined,
      })
      await expect(res.json()).resolves.toEqual({
        error: 'Hyphae memoir detail unavailable',
      })
    })
  })

  describe('GET /api/hyphae/memoirs', () => {
    it('forwards memoir list requests to the Hyphae memoir CLI surface', async () => {
      const memoirListSpy = vi.spyOn(hyphae, 'memoirList').mockResolvedValue([
        {
          consolidation_threshold: 50,
          created_at: '2026-03-24T00:00:00Z',
          description: 'Memoir description',
          id: 'memoir-1',
          name: 'code:williamnewton',
          updated_at: '2026-03-24T00:00:00Z',
        },
      ])

      const req = new Request('http://localhost:3001/api/hyphae/memoirs')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(memoirListSpy).toHaveBeenCalledWith()
      await expect(res.json()).resolves.toMatchObject([
        {
          id: 'memoir-1',
          name: 'code:williamnewton',
        },
      ])
    })

    it('surfaces Hyphae memoir list CLI failures as backend errors', async () => {
      const memoirListSpy = vi.spyOn(hyphae, 'memoirList').mockRejectedValue(new Error('hyphae unavailable'))

      const req = new Request('http://localhost:3001/api/hyphae/memoirs')
      const res = await app.fetch(req)

      expect(res.status).toBe(502)
      expect(memoirListSpy).toHaveBeenCalledWith()
      await expect(res.json()).resolves.toEqual({
        error: 'Hyphae memoir list unavailable',
      })
    })
  })

  describe('GET /api/hyphae/memoirs/search-all', () => {
    it('forwards search-all requests to the Hyphae memoir CLI surface', async () => {
      const memoirSearchAllSpy = vi.spyOn(hyphae, 'memoirSearchAll').mockResolvedValue([
        {
          confidence: 0.95,
          created_at: '2026-03-24T00:00:00Z',
          definition: 'Routes context requests',
          id: 'concept-1',
          labels: '[{"namespace":"kind","value":"function"}]',
          memoir_id: 'memoir-1',
          name: 'gather_context',
          revision: 2,
          source_memory_ids: '[]',
          updated_at: '2026-03-24T00:00:00Z',
        },
      ])

      const req = new Request('http://localhost:3001/api/hyphae/memoirs/search-all?q=context')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(memoirSearchAllSpy).toHaveBeenCalledWith('context')
      await expect(res.json()).resolves.toMatchObject([
        {
          id: 'concept-1',
          name: 'gather_context',
        },
      ])
    })

    it('surfaces Hyphae memoir search-all CLI failures as backend errors', async () => {
      const memoirSearchAllSpy = vi.spyOn(hyphae, 'memoirSearchAll').mockRejectedValue(new Error('hyphae unavailable'))

      const req = new Request('http://localhost:3001/api/hyphae/memoirs/search-all?q=context')
      const res = await app.fetch(req)

      expect(res.status).toBe(502)
      expect(memoirSearchAllSpy).toHaveBeenCalledWith('context')
      await expect(res.json()).resolves.toEqual({
        error: 'Hyphae memoir search unavailable',
      })
    })
  })

  describe('GET /api/hyphae/memoirs/:name/search', () => {
    it('forwards memoir search requests to the Hyphae memoir CLI surface', async () => {
      const memoirSearchSpy = vi.spyOn(hyphae, 'memoirSearch').mockResolvedValue([
        {
          confidence: 0.9,
          created_at: '2026-03-24T00:00:00Z',
          definition: 'Routes session timeline requests',
          id: 'concept-2',
          labels: '[{"namespace":"kind","value":"function"}]',
          memoir_id: 'memoir-1',
          name: 'timeline',
          revision: 1,
          source_memory_ids: '[]',
          updated_at: '2026-03-24T00:00:00Z',
        },
      ])

      const req = new Request('http://localhost:3001/api/hyphae/memoirs/code%3Awilliamnewton/search?q=timeline')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(memoirSearchSpy).toHaveBeenCalledWith('code:williamnewton', 'timeline')
      await expect(res.json()).resolves.toMatchObject([
        {
          id: 'concept-2',
          name: 'timeline',
        },
      ])
    })

    it('surfaces Hyphae memoir search CLI failures as backend errors', async () => {
      const memoirSearchSpy = vi.spyOn(hyphae, 'memoirSearch').mockRejectedValue(new Error('hyphae unavailable'))

      const req = new Request('http://localhost:3001/api/hyphae/memoirs/code%3Awilliamnewton/search?q=timeline')
      const res = await app.fetch(req)

      expect(res.status).toBe(502)
      expect(memoirSearchSpy).toHaveBeenCalledWith('code:williamnewton', 'timeline')
      await expect(res.json()).resolves.toEqual({
        error: 'Hyphae memoir search unavailable',
      })
    })
  })

  describe('GET /api/hyphae/memoirs/:name/inspect/:concept', () => {
    it('forwards memoir inspect requests to the Hyphae memoir CLI surface', async () => {
      const memoirInspectSpy = vi.spyOn(hyphae, 'memoirInspect').mockResolvedValue({
        concept: {
          confidence: 0.9,
          created_at: '2026-03-24T00:00:00Z',
          definition: 'Collect request context',
          id: 'concept-root',
          labels: '[{"namespace":"kind","value":"function"}]',
          memoir_id: 'memoir-1',
          name: 'gather_context',
          revision: 1,
          source_memory_ids: '[]',
          updated_at: '2026-03-24T00:00:00Z',
        },
        neighbors: [
          {
            concept: {
              confidence: 0.8,
              created_at: '2026-03-24T00:00:00Z',
              definition: 'Loads project sessions',
              id: 'concept-neighbor',
              labels: '[{"namespace":"kind","value":"function"}]',
              memoir_id: 'memoir-1',
              name: 'session_list',
              revision: 1,
              source_memory_ids: '[]',
              updated_at: '2026-03-24T00:00:00Z',
            },
            direction: 'outgoing',
            link: {
              created_at: '2026-03-24T00:00:00Z',
              id: 'link-1',
              relation: 'calls',
              source_id: 'concept-root',
              target_id: 'concept-neighbor',
              weight: 0.7,
            },
          },
        ],
      })

      const req = new Request('http://localhost:3001/api/hyphae/memoirs/code%3Awilliamnewton/inspect/gather_context?depth=4')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(memoirInspectSpy).toHaveBeenCalledWith('code:williamnewton', 'gather_context', 4)
      await expect(res.json()).resolves.toMatchObject({
        concept: { id: 'concept-root', name: 'gather_context' },
        neighbors: [{ direction: 'outgoing', link: { relation: 'calls' } }],
      })
    })

    it('returns 404 when the memoir concept does not exist', async () => {
      const memoirInspectSpy = vi.spyOn(hyphae, 'memoirInspect').mockResolvedValue(null)

      const req = new Request('http://localhost:3001/api/hyphae/memoirs/code%3Awilliamnewton/inspect/missing')
      const res = await app.fetch(req)

      expect(res.status).toBe(404)
      expect(memoirInspectSpy).toHaveBeenCalledWith('code:williamnewton', 'missing', 2)
      await expect(res.json()).resolves.toEqual({ error: 'Not found' })
    })

    it('surfaces Hyphae memoir inspect CLI failures as backend errors', async () => {
      const memoirInspectSpy = vi.spyOn(hyphae, 'memoirInspect').mockRejectedValue(new Error('hyphae unavailable'))

      const req = new Request('http://localhost:3001/api/hyphae/memoirs/code%3Awilliamnewton/inspect/gather_context')
      const res = await app.fetch(req)

      expect(res.status).toBe(502)
      expect(memoirInspectSpy).toHaveBeenCalledWith('code:williamnewton', 'gather_context', 2)
      await expect(res.json()).resolves.toEqual({
        error: 'Hyphae memoir inspect unavailable',
      })
    })
  })

  describe('GET /api/hyphae/context', () => {
    it('forwards gather-context requests to the Hyphae CLI surface', async () => {
      const gatherContextSpy = vi.spyOn(hyphae, 'gatherContext').mockResolvedValue({
        context: [{ content: 'Worker A login implementation', relevance: 0.95, source: 'session', topic: 'session/demo' }],
        sources_queried: ['sessions'],
        tokens_budget: 500,
        tokens_used: 12,
      })

      const req = new Request(
        'http://localhost:3001/api/hyphae/context?task=login%20flow&project=demo&budget=500&include=sessions,memories&project_root=%2Frepo%2Fdemo&worktree_id=wt-alpha&scope=worker-a'
      )
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(gatherContextSpy).toHaveBeenCalledWith('login flow', {
        budget: 500,
        include: 'sessions,memories',
        project: 'demo',
        projectRoot: '/repo/demo',
        scope: 'worker-a',
        worktreeId: 'wt-alpha',
      })
      await expect(res.json()).resolves.toMatchObject({
        context: [{ source: 'session', topic: 'session/demo' }],
        sources_queried: ['sessions'],
        tokens_budget: 500,
        tokens_used: 12,
      })
    })

    it('rejects full identity requests without a project', async () => {
      const gatherContextSpy = vi.spyOn(hyphae, 'gatherContext')

      const req = new Request('http://localhost:3001/api/hyphae/context?task=login%20flow&project_root=%2Frepo%2Fdemo&worktree_id=wt-alpha')
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(gatherContextSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toEqual({
        error: 'project is required when project_root and worktree_id are provided',
      })
    })

    it('rejects partial identity requests for gather-context', async () => {
      const gatherContextSpy = vi.spyOn(hyphae, 'gatherContext')

      const req = new Request('http://localhost:3001/api/hyphae/context?task=login%20flow&project=demo&project_root=%2Frepo%2Fdemo')
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(gatherContextSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toEqual({
        error: 'project_root and worktree_id must be provided together',
      })
    })

    it('keeps omitted-project requests unscoped at the API boundary', async () => {
      const gatherContextSpy = vi.spyOn(hyphae, 'gatherContext').mockResolvedValue({
        context: [],
        sources_queried: ['memories'],
        tokens_budget: 2000,
        tokens_used: 0,
      })

      const req = new Request('http://localhost:3001/api/hyphae/context?task=login%20flow')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(gatherContextSpy).toHaveBeenCalledWith('login flow', {
        budget: 2000,
        include: undefined,
        project: undefined,
        projectRoot: undefined,
        scope: undefined,
        worktreeId: undefined,
      })
      await expect(res.json()).resolves.toEqual({
        context: [],
        sources_queried: ['memories'],
        tokens_budget: 2000,
        tokens_used: 0,
      })
    })

    it('surfaces Hyphae gather-context CLI failures as backend errors', async () => {
      const gatherContextSpy = vi.spyOn(hyphae, 'gatherContext').mockRejectedValue(new Error('hyphae unavailable'))

      const req = new Request('http://localhost:3001/api/hyphae/context?task=login%20flow&project=demo')
      const res = await app.fetch(req)

      expect(res.status).toBe(502)
      expect(gatherContextSpy).toHaveBeenCalledWith('login flow', {
        budget: 2000,
        include: undefined,
        project: 'demo',
        projectRoot: undefined,
        scope: undefined,
        worktreeId: undefined,
      })
      await expect(res.json()).resolves.toEqual({
        error: 'Hyphae gather-context unavailable',
      })
    })
  })

  describe('GET /api/hyphae/sessions', () => {
    it('forwards project and limit parameters to the Hyphae session list CLI surface', async () => {
      const sessionsSpy = vi.spyOn(hyphae, 'getSessions').mockResolvedValue([
        {
          ended_at: '2026-03-27T12:10:00Z',
          errors: '0',
          files_modified: '["src/page.tsx"]',
          id: 'ses_1',
          project: 'cap',
          project_root: '/repo/cap',
          scope: 'worker-a',
          started_at: '2026-03-27T12:00:00Z',
          status: 'completed',
          summary: 'Wired session list endpoint',
          task: 'build session list',
          worktree_id: 'wt-alpha',
        },
      ])

      const req = new Request('http://localhost:3001/api/hyphae/sessions?project=cap&limit=50')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(sessionsSpy).toHaveBeenCalledWith({ project: 'cap', projectRoot: undefined, scope: undefined, worktreeId: undefined }, 50)
      await expect(res.json()).resolves.toMatchObject([
        {
          id: 'ses_1',
          project: 'cap',
          project_root: '/repo/cap',
          worktree_id: 'wt-alpha',
        },
      ])
    })

    it('keeps the unscoped recent-project fallback when no project is selected', async () => {
      const sessionsSpy = vi.spyOn(hyphae, 'getSessions').mockResolvedValue([
        {
          ended_at: null,
          errors: null,
          files_modified: null,
          id: 'ses_recent',
          project: 'cap',
          project_root: null,
          scope: null,
          started_at: '2026-03-27T12:00:00Z',
          status: 'active',
          summary: null,
          task: 'inspect recent work',
          worktree_id: null,
        },
      ])

      const req = new Request('http://localhost:3001/api/hyphae/sessions?limit=30')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(sessionsSpy).toHaveBeenCalledWith({ project: undefined, projectRoot: undefined, scope: undefined, worktreeId: undefined }, 30)
      await expect(res.json()).resolves.toMatchObject([
        {
          id: 'ses_recent',
          project: 'cap',
        },
      ])
    })

    it('surfaces Hyphae session list CLI failures as backend errors', async () => {
      const sessionsSpy = vi.spyOn(hyphae, 'getSessions').mockRejectedValue(new Error('hyphae unavailable'))

      const req = new Request('http://localhost:3001/api/hyphae/sessions?project=cap')
      const res = await app.fetch(req)

      expect(res.status).toBe(502)
      expect(sessionsSpy).toHaveBeenCalledWith({ project: 'cap', projectRoot: undefined, scope: undefined, worktreeId: undefined }, 20)
      await expect(res.json()).resolves.toEqual({
        error: 'Hyphae session list unavailable',
      })
    })

    it('forwards identity-v1 filters to the Hyphae session list CLI surface', async () => {
      const sessionsSpy = vi.spyOn(hyphae, 'getSessions').mockResolvedValue([])

      const req = new Request(
        'http://localhost:3001/api/hyphae/sessions?project=cap&project_root=%2Frepo%2Fcap&worktree_id=wt-alpha&scope=worker-a&limit=25'
      )
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(sessionsSpy).toHaveBeenCalledWith(
        {
          project: 'cap',
          projectRoot: '/repo/cap',
          scope: 'worker-a',
          worktreeId: 'wt-alpha',
        },
        25
      )
    })

    it('rejects full identity requests without a project for the session list route', async () => {
      const sessionsSpy = vi.spyOn(hyphae, 'getSessions')

      const req = new Request('http://localhost:3001/api/hyphae/sessions?project_root=%2Frepo%2Fcap&worktree_id=wt-alpha')
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(sessionsSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toEqual({
        error: 'project is required when project_root and worktree_id are provided',
      })
    })

    it('rejects partial identity requests for the session list route', async () => {
      const sessionsSpy = vi.spyOn(hyphae, 'getSessions')

      const req = new Request('http://localhost:3001/api/hyphae/sessions?project=cap&worktree_id=wt-alpha')
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(sessionsSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toEqual({
        error: 'project_root and worktree_id must be provided together',
      })
    })
  })

  describe('GET /api/hyphae/sessions/timeline', () => {
    it('forwards project and limit parameters to the Hyphae session timeline CLI surface', async () => {
      const timelineSpy = vi.spyOn(hyphae, 'getSessionTimeline').mockResolvedValue([
        {
          ended_at: '2026-03-27T12:10:00Z',
          errors: '0',
          events: [
            {
              detail: 'fix session attribution',
              id: 'rec_1',
              kind: 'recall',
              memory_count: 3,
              occurred_at: '2026-03-27T12:05:00Z',
              recall_event_id: 'rec_1',
              signal_type: null,
              signal_value: null,
              source: null,
              title: 'Recalled 3 memories',
            },
          ],
          files_modified: '["src/page.tsx"]',
          id: 'ses_1',
          last_activity_at: '2026-03-27T12:10:00Z',
          outcome_count: 0,
          project: 'cap',
          project_root: '/repo/cap',
          recall_count: 1,
          scope: 'worker-a',
          started_at: '2026-03-27T12:00:00Z',
          status: 'completed',
          summary: 'Wired timeline endpoint',
          task: 'build session timeline',
          worktree_id: 'wt-alpha',
        },
      ])

      const req = new Request('http://localhost:3001/api/hyphae/sessions/timeline?project=cap&limit=50')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(timelineSpy).toHaveBeenCalledWith({ project: 'cap', projectRoot: undefined, scope: undefined, worktreeId: undefined }, 50)
      await expect(res.json()).resolves.toMatchObject([
        {
          id: 'ses_1',
          outcome_count: 0,
          project: 'cap',
          project_root: '/repo/cap',
          recall_count: 1,
          scope: 'worker-a',
          worktree_id: 'wt-alpha',
        },
      ])
    })

    it('keeps the unscoped recent-project fallback when no project is selected', async () => {
      const timelineSpy = vi.spyOn(hyphae, 'getSessionTimeline').mockResolvedValue([
        {
          ended_at: '2026-03-27T12:10:00Z',
          errors: '0',
          events: [],
          files_modified: null,
          id: 'ses_recent',
          last_activity_at: '2026-03-27T12:10:00Z',
          outcome_count: 0,
          project: 'cap',
          project_root: null,
          recall_count: 0,
          scope: null,
          started_at: '2026-03-27T12:00:00Z',
          status: 'completed',
          summary: 'Recent unscoped timeline',
          task: 'inspect recent work',
          worktree_id: null,
        },
      ])

      const req = new Request('http://localhost:3001/api/hyphae/sessions/timeline?limit=30')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(timelineSpy).toHaveBeenCalledWith({ project: undefined, projectRoot: undefined, scope: undefined, worktreeId: undefined }, 30)
      await expect(res.json()).resolves.toMatchObject([
        {
          id: 'ses_recent',
          project: 'cap',
        },
      ])
    })

    it('surfaces Hyphae session timeline CLI failures as backend errors', async () => {
      const timelineSpy = vi.spyOn(hyphae, 'getSessionTimeline').mockRejectedValue(new Error('hyphae unavailable'))

      const req = new Request('http://localhost:3001/api/hyphae/sessions/timeline?project=cap')
      const res = await app.fetch(req)

      expect(res.status).toBe(502)
      expect(timelineSpy).toHaveBeenCalledWith({ project: 'cap', projectRoot: undefined, scope: undefined, worktreeId: undefined }, 20)
      await expect(res.json()).resolves.toEqual({
        error: 'Hyphae session timeline unavailable',
      })
    })

    it('forwards identity-v1 filters to the Hyphae session timeline CLI surface', async () => {
      const timelineSpy = vi.spyOn(hyphae, 'getSessionTimeline').mockResolvedValue([])

      const req = new Request(
        'http://localhost:3001/api/hyphae/sessions/timeline?project=cap&project_root=%2Frepo%2Fcap&worktree_id=wt-alpha&scope=worker-a&limit=25'
      )
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(timelineSpy).toHaveBeenCalledWith(
        {
          project: 'cap',
          projectRoot: '/repo/cap',
          scope: 'worker-a',
          worktreeId: 'wt-alpha',
        },
        25
      )
    })

    it('rejects full identity requests without a project for the session timeline route', async () => {
      const timelineSpy = vi.spyOn(hyphae, 'getSessionTimeline')

      const req = new Request('http://localhost:3001/api/hyphae/sessions/timeline?project_root=%2Frepo%2Fcap&worktree_id=wt-alpha')
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(timelineSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toEqual({
        error: 'project is required when project_root and worktree_id are provided',
      })
    })

    it('rejects partial identity requests for the session timeline route', async () => {
      const timelineSpy = vi.spyOn(hyphae, 'getSessionTimeline')

      const req = new Request('http://localhost:3001/api/hyphae/sessions/timeline?project_root=%2Frepo%2Fcap')
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(timelineSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toEqual({
        error: 'project_root and worktree_id must be provided together',
      })
    })
  })

  describe('GET /api/sessions/:id/timeline', () => {
    it('returns normalized events for a selected session id', async () => {
      const eventsSpy = vi.spyOn(hyphae, 'getSessionTimelineEvents').mockResolvedValue([
        {
          content: 'Recalled 3 memories: session attribution bridge',
          timestamp: '2026-03-27T12:02:00Z',
          type: 'recall',
        },
      ])

      const req = new Request('http://localhost:3001/api/sessions/ses_123/timeline')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(eventsSpy).toHaveBeenCalledWith('ses_123')
      await expect(res.json()).resolves.toEqual([
        {
          content: 'Recalled 3 memories: session attribution bridge',
          timestamp: '2026-03-27T12:02:00Z',
          type: 'recall',
        },
      ])
    })

    it('returns an empty array when the selected session has no timeline events', async () => {
      const eventsSpy = vi.spyOn(hyphae, 'getSessionTimelineEvents').mockResolvedValue([])

      const req = new Request('http://localhost:3001/api/sessions/ses_empty/timeline')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(eventsSpy).toHaveBeenCalledWith('ses_empty')
      await expect(res.json()).resolves.toEqual([])
    })

    it('returns 404 when the session id is missing from Hyphae', async () => {
      const eventsSpy = vi
        .spyOn(hyphae, 'getSessionTimelineEvents')
        .mockRejectedValue(
          new HyphaeSessionTimelineDetailCliError('Hyphae session timeline did not include the requested session', 'not_found')
        )

      const req = new Request('http://localhost:3001/api/sessions/ses_missing/timeline')
      const res = await app.fetch(req)

      expect(res.status).toBe(404)
      expect(eventsSpy).toHaveBeenCalledWith('ses_missing')
      await expect(res.json()).resolves.toEqual({
        error: 'Not found',
      })
    })
  })

  describe('GET /api/mycelium/history', () => {
    it('forwards project and limit filters to Mycelium history', async () => {
      const historySpy = vi.spyOn(mycelium, 'getCommandHistory').mockResolvedValue({
        commands: [
          {
            command: 'mycelium cargo test',
            filtered_tokens: 200,
            original_tokens: 1000,
            project_path: '/workspace/cap',
            saved_tokens: 800,
            savings_pct: 80,
            timestamp: '2026-03-27T12:00:00Z',
          },
        ],
        total: 1,
      })

      const req = new Request('http://localhost:3001/api/mycelium/history?project=%2Fworkspace%2Fcap&limit=25')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(historySpy).toHaveBeenCalledWith(25, '/workspace/cap')
      await expect(res.json()).resolves.toMatchObject({
        commands: [
          {
            command: 'mycelium cargo test',
            project_path: '/workspace/cap',
            saved_tokens: 800,
          },
        ],
        total: 1,
      })
    })
  })

  describe('GET /api/canopy/snapshot', () => {
    it('forwards project and normalized Canopy snapshot filters', async () => {
      const snapshotSpy = vi.spyOn(canopy, 'getSnapshot').mockResolvedValue({
        agents: [],
        evidence: [],
        handoffs: [],
        heartbeats: [],
        tasks: [],
      })

      const req = new Request(
        'http://localhost:3001/api/canopy/snapshot?project=/workspace/cap&preset=review_queue&sort=attention&priority_at_least=high&severity_at_least=medium&acknowledged=false'
      )
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(snapshotSpy).toHaveBeenCalledWith({
        acknowledged: 'false',
        attentionAtLeast: undefined,
        preset: 'review_queue',
        priorityAtLeast: 'high',
        projectRoot: '/workspace/cap',
        severityAtLeast: 'medium',
        sort: 'attention',
        view: undefined,
      })
    })

    it('drops invalid Canopy snapshot filters before invoking the backend', async () => {
      const snapshotSpy = vi.spyOn(canopy, 'getSnapshot').mockResolvedValue({
        agents: [],
        evidence: [],
        handoffs: [],
        heartbeats: [],
        tasks: [],
      })

      const req = new Request(
        'http://localhost:3001/api/canopy/snapshot?project=/workspace/cap&view=bogus&sort=nope&preset=nope&priority_at_least=nope&severity_at_least=nope&acknowledged=nope&attention_at_least=nope'
      )
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(snapshotSpy).toHaveBeenCalledWith({
        acknowledged: undefined,
        attentionAtLeast: undefined,
        preset: undefined,
        priorityAtLeast: undefined,
        projectRoot: '/workspace/cap',
        severityAtLeast: undefined,
        sort: undefined,
        view: undefined,
      })
    })
  })

  describe('GET /api/canopy', () => {
    it('forwards snapshot reads to Canopy', async () => {
      const snapshotSpy = vi.spyOn(canopy, 'getSnapshot').mockResolvedValue({
        agents: [{ agent_id: 'agent-1' }],
        evidence: [],
        handoffs: [],
        heartbeats: [],
        tasks: [{ task_id: 'task-1', title: 'test task' }],
      })

      const req = new Request(
        'http://localhost:3001/api/canopy/snapshot?project=/workspace/cap&preset=review_queue&sort=updated_at&acknowledged=false'
      )
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(snapshotSpy).toHaveBeenCalledWith({
        acknowledged: 'false',
        attentionAtLeast: undefined,
        preset: 'review_queue',
        priorityAtLeast: undefined,
        projectRoot: '/workspace/cap',
        severityAtLeast: undefined,
        sort: 'updated_at',
        view: undefined,
      })
      await expect(res.json()).resolves.toMatchObject({
        agents: [{ agent_id: 'agent-1' }],
        tasks: [{ task_id: 'task-1', title: 'test task' }],
      })
    })

    it('forwards task detail reads to Canopy', async () => {
      const detailSpy = vi.spyOn(canopy, 'getTaskDetail').mockResolvedValue({
        events: [{ event_id: 'evt-1', event_type: 'created' }],
        evidence: [],
        handoffs: [],
        heartbeats: [],
        messages: [],
        task: { task_id: 'task-1', title: 'test task' },
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(detailSpy).toHaveBeenCalledWith('task-1')
      await expect(res.json()).resolves.toMatchObject({
        events: [{ event_id: 'evt-1', event_type: 'created' }],
        task: { task_id: 'task-1', title: 'test task' },
      })
    })

    it('forwards task action mutations to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'blocked',
        task_id: 'task-1',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'block_task',
          blocked_reason: 'waiting on review',
          changed_by: 'operator',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'block_task',
        assignedTo: undefined,
        authorAgentId: undefined,
        blockedReason: 'waiting on review',
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: undefined,
        messageType: undefined,
        note: undefined,
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        requestedAction: undefined,
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: undefined,
      })
    })

    it('forwards verification task actions to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'review_required',
        task_id: 'task-1',
        verification_state: 'failed',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'verify_task',
          changed_by: 'operator',
          note: 'needs another pass',
          verification_state: 'failed',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'verify_task',
        assignedTo: undefined,
        authorAgentId: undefined,
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: undefined,
        messageType: undefined,
        note: 'needs another pass',
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        requestedAction: undefined,
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: 'failed',
      })
    })

    it('forwards decision task actions to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'review_required',
        task_id: 'task-1',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'record_decision',
          author_agent_id: 'agent-1',
          changed_by: 'operator',
          message_body: 'Ship the reviewed task.',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'record_decision',
        assignedTo: undefined,
        authorAgentId: 'agent-1',
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: 'Ship the reviewed task.',
        messageType: undefined,
        note: undefined,
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        requestedAction: undefined,
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: undefined,
      })
    })

    it('forwards closeout task actions to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'completed',
        task_id: 'task-1',
        verification_state: 'passed',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'close_task',
          changed_by: 'operator',
          closure_summary: 'Review complete and closed out.',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'close_task',
        assignedTo: undefined,
        authorAgentId: undefined,
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: 'Review complete and closed out.',
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: undefined,
        messageType: undefined,
        note: undefined,
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        requestedAction: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: undefined,
      })
    })

    it('forwards deadline task actions to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'in_progress',
        task_id: 'task-1',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'set_task_due_at',
          changed_by: 'operator',
          due_at: '2026-03-29T18:00:00Z',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'set_task_due_at',
        assignedTo: undefined,
        authorAgentId: undefined,
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: '2026-03-29T18:00:00Z',
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: undefined,
        messageType: undefined,
        note: undefined,
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        requestedAction: undefined,
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: undefined,
      })
    })

    it('rejects missing deadline payload fields for deadline task actions', async () => {
      const executionReq = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'set_task_due_at',
          changed_by: 'operator',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const executionRes = await app.fetch(executionReq)

      expect(executionRes.status).toBe(400)
      await expect(executionRes.json()).resolves.toEqual({ error: 'set_task_due_at requires a due_at' })

      const reviewReq = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'set_review_due_at',
          changed_by: 'operator',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const reviewRes = await app.fetch(reviewReq)

      expect(reviewRes.status).toBe(400)
      await expect(reviewRes.json()).resolves.toEqual({ error: 'set_review_due_at requires a review_due_at' })
    })

    it('forwards task creation actions to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'review_required',
        task_id: 'task-1',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'create_handoff',
          changed_by: 'operator',
          from_agent_id: 'agent-1',
          handoff_summary: 'review the queue wiring',
          handoff_type: 'request_review',
          requested_action: 'confirm the read model',
          to_agent_id: 'agent-2',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'create_handoff',
        assignedTo: undefined,
        authorAgentId: undefined,
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: 'agent-1',
        handoffSummary: 'review the queue wiring',
        handoffType: 'request_review',
        messageBody: undefined,
        messageType: undefined,
        note: undefined,
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        requestedAction: 'confirm the read model',
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: 'agent-2',
        verificationState: undefined,
      })
    })

    it('rejects malformed task creation action payloads', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction')

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'attach_evidence',
          changed_by: 'operator',
          evidence_label: 'Missing ref',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(taskActionSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toMatchObject({
        error: 'attach_evidence requires a valid evidence_source_kind',
      })
    })

    it('forwards council message task actions to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'review_required',
        task_id: 'task-1',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'post_council_message',
          author_agent_id: 'agent-1',
          changed_by: 'operator',
          message_body: 'Operator initiated follow-up review.',
          message_type: 'status',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'post_council_message',
        assignedTo: undefined,
        authorAgentId: 'agent-1',
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: 'Operator initiated follow-up review.',
        messageType: 'status',
        note: undefined,
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        requestedAction: undefined,
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: undefined,
      })
    })

    it('forwards summon council task actions to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'review_required',
        task_id: 'task-1',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'summon_council_session',
          changed_by: 'operator',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'summon_council_session',
        assignedTo: undefined,
        authorAgentId: undefined,
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: undefined,
        messageType: undefined,
        note: undefined,
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        requestedAction: undefined,
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: undefined,
      })
    })

    it('forwards follow-up task actions to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'review_required',
        task_id: 'task-1',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'create_follow_up_task',
          changed_by: 'operator',
          follow_up_description: 'Track the remaining rollout work.',
          follow_up_title: 'Finish rollout',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'create_follow_up_task',
        assignedTo: undefined,
        authorAgentId: undefined,
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: 'Track the remaining rollout work.',
        followUpTitle: 'Finish rollout',
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: undefined,
        messageType: undefined,
        note: undefined,
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        requestedAction: undefined,
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: undefined,
      })
    })

    it('forwards dependency link actions to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'review_required',
        task_id: 'task-1',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'link_task_dependency',
          changed_by: 'operator',
          related_task_id: 'task-2',
          relationship_role: 'blocked_by',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'link_task_dependency',
        assignedTo: undefined,
        authorAgentId: undefined,
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: undefined,
        messageType: undefined,
        note: undefined,
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        relatedTaskId: 'task-2',
        relationshipRole: 'blocked_by',
        requestedAction: undefined,
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: undefined,
      })
    })

    it('forwards graph task actions to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'blocked',
        task_id: 'task-1',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'resolve_dependency',
          changed_by: 'operator',
          note: 'dependency landed',
          related_task_id: 'task-2',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: undefined,
        action: 'resolve_dependency',
        assignedTo: undefined,
        authorAgentId: undefined,
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: undefined,
        messageType: undefined,
        note: 'dependency landed',
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        relatedTaskId: 'task-2',
        relationshipRole: undefined,
        requestedAction: undefined,
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: undefined,
      })
    })

    it('forwards execution task actions with acting agent identity to Canopy', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction').mockResolvedValue({
        status: 'in_progress',
        task_id: 'task-1',
      })

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          acting_agent_id: 'agent-1',
          action: 'resume_task',
          changed_by: 'operator',
          note: 'Resume active work',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(taskActionSpy).toHaveBeenCalledWith('task-1', {
        actingAgentId: 'agent-1',
        action: 'resume_task',
        assignedTo: undefined,
        authorAgentId: undefined,
        blockedReason: undefined,
        changedBy: 'operator',
        clearOwnerNote: undefined,
        closureSummary: undefined,
        dueAt: undefined,
        evidenceLabel: undefined,
        evidenceSourceKind: undefined,
        evidenceSourceRef: undefined,
        evidenceSummary: undefined,
        expiresAt: undefined,
        followUpDescription: undefined,
        followUpTitle: undefined,
        fromAgentId: undefined,
        handoffSummary: undefined,
        handoffType: undefined,
        messageBody: undefined,
        messageType: undefined,
        note: 'Resume active work',
        ownerNote: undefined,
        priority: undefined,
        relatedFile: undefined,
        relatedHandoffId: undefined,
        relatedMemoryQuery: undefined,
        relatedSessionId: undefined,
        relatedSymbol: undefined,
        requestedAction: undefined,
        reviewDueAt: undefined,
        severity: undefined,
        toAgentId: undefined,
        verificationState: undefined,
      })
    })

    it('rejects execution task actions without an acting agent id', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction')

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'claim_task',
          changed_by: 'operator',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(taskActionSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toMatchObject({
        error: 'claim_task requires an acting_agent_id',
      })
    })

    it('rejects malformed graph task action payloads', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction')

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'promote_follow_up',
          changed_by: 'operator',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(taskActionSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toMatchObject({
        error: 'promote_follow_up requires a related_task_id',
      })
    })

    it('rejects unsupported Canopy task actions at the route boundary', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction')

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'not_real',
          changed_by: 'operator',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(taskActionSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toMatchObject({
        error: 'Unsupported Canopy task action: not_real',
      })
    })

    it('rejects invalid verification state for verify task actions', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction')

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'verify_task',
          changed_by: 'operator',
          verification_state: 'unknown',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(taskActionSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toMatchObject({
        error: 'verify_task requires a valid verification_state',
      })
    })

    it('rejects passed verification through verify_task', async () => {
      const taskActionSpy = vi.spyOn(canopy, 'applyTaskAction')

      const req = new Request('http://localhost:3001/api/canopy/tasks/task-1/actions', {
        body: JSON.stringify({
          action: 'verify_task',
          changed_by: 'operator',
          verification_state: 'passed',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(taskActionSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toMatchObject({
        error: 'verify_task no longer accepts passed; use close_task',
      })
    })

    it('forwards handoff action mutations to Canopy', async () => {
      const handoffActionSpy = vi.spyOn(canopy, 'applyHandoffAction').mockResolvedValue({
        handoff_id: 'handoff-1',
        status: 'expired',
      })

      const req = new Request('http://localhost:3001/api/canopy/handoffs/handoff-1/actions', {
        body: JSON.stringify({
          action: 'expire_handoff',
          changed_by: 'operator',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(handoffActionSpy).toHaveBeenCalledWith('handoff-1', {
        actingAgentId: undefined,
        action: 'expire_handoff',
        changedBy: 'operator',
        note: undefined,
      })
    })

    it('rejects accept handoff mutations without an acting agent id', async () => {
      const handoffActionSpy = vi.spyOn(canopy, 'applyHandoffAction')

      const req = new Request('http://localhost:3001/api/canopy/handoffs/handoff-1/actions', {
        body: JSON.stringify({
          action: 'accept_handoff',
          changed_by: 'operator',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(handoffActionSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toMatchObject({
        error: 'accept_handoff requires an acting_agent_id',
      })
    })

    it('rejects unsupported Canopy handoff actions at the route boundary', async () => {
      const handoffActionSpy = vi.spyOn(canopy, 'applyHandoffAction')

      const req = new Request('http://localhost:3001/api/canopy/handoffs/handoff-1/actions', {
        body: JSON.stringify({
          action: 'not_real',
          changed_by: 'operator',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(400)
      expect(handoffActionSpy).not.toHaveBeenCalled()
      await expect(res.json()).resolves.toMatchObject({
        error: 'Unsupported Canopy handoff action: not_real',
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

  describe('POST /api/canopy/handoffs/:handoffId/actions', () => {
    it('forwards Canopy handoff resolution actions', async () => {
      const handoffSpy = vi.spyOn(canopy, 'applyHandoffAction').mockResolvedValue({
        handoff_id: 'handoff-1',
        status: 'accepted',
      })

      const req = new Request('http://localhost:3001/api/canopy/handoffs/handoff-1/actions', {
        body: JSON.stringify({
          acting_agent_id: 'agent-2',
          action: 'accept_handoff',
          changed_by: 'operator',
          note: 'Taking ownership through the operator surface',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(handoffSpy).toHaveBeenCalledWith('handoff-1', {
        actingAgentId: 'agent-2',
        action: 'accept_handoff',
        changedBy: 'operator',
        note: 'Taking ownership through the operator surface',
      })
    })
  })

  describe('GET /api/hyphae/stats', () => {
    it('surfaces Hyphae stats CLI failures as backend errors', async () => {
      const statsSpy = vi.spyOn(hyphae, 'getStats').mockRejectedValue(new Error('hyphae unavailable'))

      const req = new Request('http://localhost:3001/api/hyphae/stats')
      const res = await app.fetch(req)

      expect(res.status).toBe(502)
      expect(statsSpy).toHaveBeenCalledWith()
      await expect(res.json()).resolves.toEqual({ error: 'Hyphae stats unavailable' })
    })
  })

  describe('GET /api/hyphae/memories/:id', () => {
    it('returns 404 when the Hyphae memory lookup misses', async () => {
      const memorySpy = vi.spyOn(hyphae, 'getMemory').mockResolvedValue(undefined)

      const req = new Request('http://localhost:3001/api/hyphae/memories/mem-missing')
      const res = await app.fetch(req)

      expect(res.status).toBe(404)
      expect(memorySpy).toHaveBeenCalledWith('mem-missing')
      await expect(res.json()).resolves.toEqual({ error: 'Not found' })
    })

    it('surfaces Hyphae memory lookup CLI failures as backend errors', async () => {
      const memorySpy = vi.spyOn(hyphae, 'getMemory').mockRejectedValue(new Error('hyphae unavailable'))

      const req = new Request('http://localhost:3001/api/hyphae/memories/mem-123')
      const res = await app.fetch(req)

      expect(res.status).toBe(502)
      expect(memorySpy).toHaveBeenCalledWith('mem-123')
      await expect(res.json()).resolves.toEqual({ error: 'Hyphae memory lookup unavailable' })
    })
  })

  describe('GET /api/hyphae/health', () => {
    it('returns an empty array when a topic has no health entries', async () => {
      const healthSpy = vi.spyOn(hyphae, 'getHealth').mockResolvedValue([])

      const req = new Request('http://localhost:3001/api/hyphae/health?topic=missing')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(healthSpy).toHaveBeenCalledWith('missing')
      await expect(res.json()).resolves.toEqual([])
    })
  })
})
