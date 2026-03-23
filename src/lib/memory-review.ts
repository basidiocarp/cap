import type { Memory } from './api'

export interface MemoryReviewState {
  description: string
  kind: 'active' | 'invalidated' | 'stale'
}

const STALE_WEIGHT_THRESHOLD = 0.3
const STALE_AGE_DAYS = 30

function ageInDays(date: string, now = Date.now()): number {
  return Math.floor((now - new Date(date).getTime()) / 86_400_000)
}

export function isMemoryInvalidated(memory: Memory): boolean {
  return Boolean(memory.invalidated_at)
}

export function isMemoryStale(memory: Memory, now = Date.now()): boolean {
  if (typeof memory.is_stale === 'boolean') return memory.is_stale
  if (isMemoryInvalidated(memory)) return false

  const reference = memory.updated_at || memory.created_at
  return memory.weight < STALE_WEIGHT_THRESHOLD && ageInDays(reference, now) >= STALE_AGE_DAYS
}

export function getMemoryReviewState(memory: Memory, now = Date.now()): MemoryReviewState {
  if (isMemoryInvalidated(memory)) {
    return {
      description: memory.invalidation_reason || 'This memory was explicitly invalidated.',
      kind: 'invalidated',
    }
  }

  if (isMemoryStale(memory, now)) {
    return {
      description: memory.stale_reason || 'This memory looks stale and should be reviewed before reuse.',
      kind: 'stale',
    }
  }

  return {
    description: 'This memory is active and available for normal recall.',
    kind: 'active',
  }
}
