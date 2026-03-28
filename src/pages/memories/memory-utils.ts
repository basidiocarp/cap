import type { Memory } from '../../lib/api'
import { parseJsonArray } from '../../lib/parse'

export type ReviewFilter = 'active' | 'all' | 'invalidated' | 'stale'

export function weightColor(weight: number): string {
  if (weight >= 0.7) return 'mycelium'
  if (weight >= 0.4) return 'yellow'
  if (weight >= 0.2) return 'orange'
  return 'red'
}

export function getKeywords(kw: unknown): string[] {
  if (Array.isArray(kw)) return kw
  if (typeof kw === 'string') return parseJsonArray<string>(kw)
  return []
}

export function getRelatedIds(ids: unknown): string[] {
  if (Array.isArray(ids)) return ids
  if (typeof ids === 'string') return parseJsonArray<string>(ids)
  return []
}

export function topicIcon(topic: string): string {
  if (topic.startsWith('errors/')) return 'E'
  if (topic.startsWith('session/')) return 'S'
  if (topic.startsWith('decisions/')) return 'D'
  if (topic.startsWith('context/')) return 'C'
  if (topic.startsWith('corrections')) return 'X'
  if (topic.startsWith('tests/')) return 'T'
  if (topic.startsWith('reviews/')) return 'R'
  if (topic.startsWith('preferences')) return 'P'
  return topic.charAt(0).toUpperCase()
}

export function topicColor(topic: string): string {
  if (topic.startsWith('errors/')) return 'red'
  if (topic.startsWith('session/')) return 'substrate'
  if (topic.startsWith('decisions/')) return 'mycelium'
  if (topic.startsWith('context/')) return 'lichen'
  if (topic.startsWith('corrections')) return 'orange'
  if (topic.startsWith('tests/')) return 'spore'
  if (topic.startsWith('reviews/')) return 'fruiting'
  return 'gray'
}

export function reviewColor(kind: 'active' | 'invalidated' | 'stale'): string {
  if (kind === 'invalidated') return 'red'
  if (kind === 'stale') return 'yellow'
  return 'gray'
}

export function reviewLabel(kind: 'active' | 'invalidated' | 'stale'): string {
  if (kind === 'invalidated') return 'Invalidated'
  if (kind === 'stale') return 'Stale'
  return 'Active'
}

export function getReviewFilterHint(filter: ReviewFilter): string {
  if (filter === 'active') return 'Active memories are available for normal recall.'
  if (filter === 'stale') return 'Stale memories should be reviewed before you trust them again.'
  if (filter === 'invalidated') return 'Invalidated memories stay visible for audit, but should stop driving normal recall.'
  return 'Review states help you separate reusable memories from items that need attention.'
}

export function getMemoryFollowUpQuery(memory: Memory): string | null {
  const keywords = getKeywords(memory.keywords)

  if (keywords.length > 0) {
    return keywords[0]
  }

  const topicParts = memory.topic.split('/').filter(Boolean)
  return topicParts.length > 1 ? topicParts[topicParts.length - 1] : null
}
