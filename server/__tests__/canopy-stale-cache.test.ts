import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as canopy from '../canopy'
import { createApp } from '../index'
import { clearSnapshotCache } from '../routes/canopy'

// ─────────────────────────────────────────────────────────────────────────────
// Canopy Stale-on-Error Cache Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Canopy stale-on-error cache (/api/canopy/snapshot)', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.restoreAllMocks()
    // Clear the module-level stale cache so tests don't bleed into each other
    clearSnapshotCache()
    app = createApp()
  })

  it('returns 503 when canopy is unavailable and no cache exists', async () => {
    const snapshotSpy = vi.spyOn(canopy, 'getSnapshot').mockRejectedValue(new Error('Canopy CLI not found'))

    const req = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/cap')
    const res = await app.fetch(req)

    expect(res.status).toBe(503)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.error).toBe('Canopy unavailable')
    expect(json.stale).toBe(false)
    expect(snapshotSpy).toHaveBeenCalled()
  })

  it('returns stale snapshot when canopy fails and cache is fresh', async () => {
    // First call succeeds and populates the cache
    const snapshotSpy = vi.spyOn(canopy, 'getSnapshot')

    const cachedSnapshot = {
      agents: [{ agent_id: 'agent-1' }],
      evidence: [],
      handoffs: [],
      heartbeats: [],
      tasks: [{ task_id: 'task-1', title: 'cached task' }],
    }

    snapshotSpy.mockResolvedValue(cachedSnapshot)

    // First request populates cache
    let req = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/cap')
    let res = await app.fetch(req)
    expect(res.status).toBe(200)
    const cachedRes = (await res.json()) as Record<string, unknown>
    expect(cachedRes.tasks).toEqual([{ task_id: 'task-1', title: 'cached task' }])

    // Now make canopy fail
    snapshotSpy.mockRejectedValue(new Error('Canopy CLI crashed'))

    // Second request should return stale cache with stale: true
    req = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/cap')
    res = await app.fetch(req)

    expect(res.status).toBe(200)
    const staleRes = (await res.json()) as Record<string, unknown>
    expect(staleRes.stale).toBe(true)
    expect(staleRes.tasks).toEqual([{ task_id: 'task-1', title: 'cached task' }])
    expect(staleRes.agents).toEqual([{ agent_id: 'agent-1' }])
  })

  it('returns 503 when canopy fails and cache is expired (>60s old)', async () => {
    const snapshotSpy = vi.spyOn(canopy, 'getSnapshot')

    const cachedSnapshot = {
      agents: [],
      evidence: [],
      handoffs: [],
      heartbeats: [],
      tasks: [{ task_id: 'task-1', title: 'cached task' }],
    }

    snapshotSpy.mockResolvedValue(cachedSnapshot)

    // First request populates cache
    let req = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/cap')
    let res = await app.fetch(req)
    expect(res.status).toBe(200)

    // Mock Date.now() to simulate time passing (>60s)
    const originalNow = Date.now
    const baseTime = originalNow()
    let currentTime = baseTime

    vi.spyOn(global.Date, 'now').mockImplementation(() => {
      return currentTime
    })

    // Advance time by 61 seconds (past SNAPSHOT_STALE_MS threshold of 60_000)
    currentTime = baseTime + 61_000

    // Now make canopy fail
    snapshotSpy.mockRejectedValue(new Error('Canopy CLI crashed'))

    // Third request should return 503 because cache is expired
    req = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/cap')
    res = await app.fetch(req)

    expect(res.status).toBe(503)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.error).toBe('Canopy unavailable')
    expect(json.stale).toBe(false)

    // Cleanup
    Date.now = originalNow
  })

  it('handles snapshot missing drift_signals field gracefully', async () => {
    vi.spyOn(canopy, 'getSnapshot').mockResolvedValue({
      agents: [],
      evidence: [],
      handoffs: [],
      heartbeats: [],
      tasks: [],
      // Note: no drift_signals field
    })

    const req = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/cap')
    const res = await app.fetch(req)

    // Should still return 200, not 500
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json).toHaveProperty('tasks')
    expect(json).toHaveProperty('evidence')
  })

  it('returns fresh snapshot with stale: false when canopy succeeds', async () => {
    vi.spyOn(canopy, 'getSnapshot').mockResolvedValue({
      agents: [],
      evidence: [],
      handoffs: [],
      heartbeats: [],
      tasks: [{ task_id: 'task-1', title: 'fresh task' }],
    })

    const req = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/cap')
    const res = await app.fetch(req)

    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json.stale).not.toBe(true) // Fresh response should not have stale: true
    expect(json.tasks).toEqual([{ task_id: 'task-1', title: 'fresh task' }])
  })

  it('passes query parameters to canopy.getSnapshot', async () => {
    const snapshotSpy = vi.spyOn(canopy, 'getSnapshot').mockResolvedValue({
      agents: [],
      evidence: [],
      handoffs: [],
      heartbeats: [],
      tasks: [],
    })

    const req = new Request(
      'http://localhost:3001/api/canopy/snapshot?project=/workspace/cap&preset=review_queue&sort=attention&priority_at_least=high'
    )
    const res = await app.fetch(req)

    expect(res.status).toBe(200)
    expect(snapshotSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        preset: 'review_queue',
        priorityAtLeast: 'high',
        projectRoot: '/workspace/cap',
        sort: 'attention',
      })
    )
  })

  it('two-project: failure for project A does NOT return stale data from project B', async () => {
    const snapshotSpy = vi.spyOn(canopy, 'getSnapshot')

    const projectBSnapshot = {
      agents: [],
      evidence: [],
      handoffs: [],
      heartbeats: [],
      tasks: [{ task_id: 'task-b', title: 'project B task' }],
    }

    // First request for project B succeeds and populates cache for project B
    snapshotSpy.mockResolvedValue(projectBSnapshot)
    const reqB = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/project-b')
    const resB = await app.fetch(reqB)
    expect(resB.status).toBe(200)
    const bodyB = (await resB.json()) as Record<string, unknown>
    expect(bodyB.tasks).toEqual([{ task_id: 'task-b', title: 'project B task' }])

    // Now make canopy fail for all requests
    snapshotSpy.mockRejectedValue(new Error('Canopy CLI crashed'))

    // Request for project A (different project) should NOT get project B stale data
    const reqA = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/project-a')
    const resA = await app.fetch(reqA)

    expect(resA.status).toBe(503)
    const bodyA = (await resA.json()) as Record<string, unknown>
    expect(bodyA.error).toBe('Canopy unavailable')
    expect(bodyA.stale).toBe(false)
  })

  it('two-filter: failure for filter combo X does NOT return stale data from filter combo Y', async () => {
    const snapshotSpy = vi.spyOn(canopy, 'getSnapshot')

    const reviewQueueSnapshot = {
      agents: [],
      evidence: [],
      handoffs: [],
      heartbeats: [],
      tasks: [{ task_id: 'task-review', title: 'review queue task' }],
    }

    // First request with preset=review_queue succeeds and populates that cache entry
    snapshotSpy.mockResolvedValue(reviewQueueSnapshot)
    const reqReview = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/cap&preset=review_queue')
    const resReview = await app.fetch(reqReview)
    expect(resReview.status).toBe(200)
    const bodyReview = (await resReview.json()) as Record<string, unknown>
    expect(bodyReview.tasks).toEqual([{ task_id: 'task-review', title: 'review queue task' }])

    // Now make canopy fail for all requests
    snapshotSpy.mockRejectedValue(new Error('Canopy CLI crashed'))

    // Request with a different filter (no preset) should NOT get review_queue stale data
    const reqNoFilter = new Request('http://localhost:3001/api/canopy/snapshot?project=/workspace/cap')
    const resNoFilter = await app.fetch(reqNoFilter)

    expect(resNoFilter.status).toBe(503)
    const bodyNoFilter = (await resNoFilter.json()) as Record<string, unknown>
    expect(bodyNoFilter.error).toBe('Canopy unavailable')
    expect(bodyNoFilter.stale).toBe(false)
  })
})
