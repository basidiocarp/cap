import { describe, expect, it } from 'vitest'

import type { Memory } from '../../src/lib/api'
import { getMemoryReviewState, isMemoryInvalidated, isMemoryStale } from '../../src/lib/memory-review'

const baseMemory: Memory = {
  access_count: 1,
  created_at: '2026-01-01T00:00:00Z',
  id: 'mem-1',
  importance: 'medium',
  invalidated_at: null,
  invalidated_by: null,
  invalidation_reason: null,
  is_stale: null,
  keywords: '[]',
  last_accessed: '2026-01-02T00:00:00Z',
  raw_excerpt: null,
  related_ids: '[]',
  source_data: null,
  source_type: 'manual',
  stale_reason: null,
  summary: 'Deploy flag details',
  superseded_by_memory_id: null,
  topic: 'deploy',
  updated_at: '2026-01-02T00:00:00Z',
  weight: 0.9,
}

describe('memory review state', () => {
  it('treats explicitly invalidated memories as invalidated', () => {
    const memory: Memory = {
      ...baseMemory,
      invalidated_at: '2026-03-01T00:00:00Z',
      invalidation_reason: 'Superseded by the new deploy flow',
    }

    expect(isMemoryInvalidated(memory)).toBe(true)
    expect(getMemoryReviewState(memory)).toEqual({
      description: 'Superseded by the new deploy flow',
      kind: 'invalidated',
    })
  })

  it('treats low-weight old memories as stale when the API does not provide a stale flag', () => {
    const memory: Memory = {
      ...baseMemory,
      updated_at: '2026-01-10T00:00:00Z',
      weight: 0.2,
    }

    const now = new Date('2026-03-15T00:00:00Z').getTime()
    expect(isMemoryStale(memory, now)).toBe(true)
    expect(getMemoryReviewState(memory, now)).toEqual({
      description: 'This memory looks stale and should be reviewed before reuse.',
      kind: 'stale',
    })
  })

  it('prefers the server-provided stale signal when present', () => {
    const memory: Memory = {
      ...baseMemory,
      is_stale: true,
      stale_reason: 'Contradicted by newer staging validation',
      weight: 0.95,
    }

    expect(isMemoryStale(memory)).toBe(true)
    expect(getMemoryReviewState(memory)).toEqual({
      description: 'Contradicted by newer staging validation',
      kind: 'stale',
    })
  })
})
