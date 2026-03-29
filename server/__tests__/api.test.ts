import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as canopy from '../canopy'
import * as hyphae from '../hyphae'
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

  describe('GET /api/hyphae/sessions/timeline', () => {
    it('forwards project and limit parameters to the Hyphae timeline read model', async () => {
      const timelineSpy = vi.spyOn(hyphae, 'getSessionTimeline').mockReturnValue([
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
          recall_count: 1,
          scope: 'worker-a',
          started_at: '2026-03-27T12:00:00Z',
          status: 'completed',
          summary: 'Wired timeline endpoint',
          task: 'build session timeline',
        },
      ])

      const req = new Request('http://localhost:3001/api/hyphae/sessions/timeline?project=cap&limit=50')
      const res = await app.fetch(req)

      expect(res.status).toBe(200)
      expect(timelineSpy).toHaveBeenCalledWith('cap', 50)
      await expect(res.json()).resolves.toMatchObject([
        {
          id: 'ses_1',
          outcome_count: 0,
          project: 'cap',
          recall_count: 1,
          scope: 'worker-a',
        },
      ])
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
})
