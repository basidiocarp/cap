const BASE = '/api'

async function get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v)
    }
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// --- Types matching server/types.ts ---

export interface Memory {
  id: string
  created_at: string
  updated_at: string
  last_accessed: string
  access_count: number
  weight: number
  topic: string
  summary: string
  raw_excerpt: string | null
  keywords: string
  importance: string
  source_type: string
  related_ids: string
}

export interface TopicSummary {
  topic: string
  count: number
  avg_weight: number
  newest: string
  oldest: string
}

export interface Stats {
  total_memories: number
  total_topics: number
  avg_weight: number
  oldest: string | null
  newest: string | null
}

export interface HealthResult {
  topic: string
  count: number
  avg_weight: number
  low_weight_count: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
}

export interface Memoir {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  consolidation_threshold: number
}

export interface Concept {
  id: string
  memoir_id: string
  name: string
  definition: string
  labels: string
  confidence: number
  revision: number
  created_at: string
  updated_at: string
  source_memory_ids: string
}

export interface ConceptLink {
  id: string
  source_id: string
  target_id: string
  relation: string
  weight: number
  created_at: string
}

export interface MemoirDetail {
  memoir: Memoir
  concepts: Concept[]
}

export interface ConceptNeighbor {
  concept: Concept
  link: ConceptLink
  direction: 'outgoing' | 'incoming'
}

export interface ConceptInspection {
  concept: Concept
  neighbors: ConceptNeighbor[]
}

// --- API ---

export const hyphaeApi = {
  health: (topic?: string) => get<HealthResult[]>('/hyphae/health', { topic: topic ?? '' }),
  memoir: (name: string) => get<MemoirDetail>(`/hyphae/memoirs/${encodeURIComponent(name)}`),
  memoirInspect: (memoir: string, concept: string, depth?: number) =>
    get<ConceptInspection>(`/hyphae/memoirs/${encodeURIComponent(memoir)}/inspect/${encodeURIComponent(concept)}`, {
      depth: depth ? String(depth) : '',
    }),
  memoirSearch: (memoir: string, q: string) => get<Concept[]>(`/hyphae/memoirs/${encodeURIComponent(memoir)}/search`, { q }),
  memoirSearchAll: (q: string) => get<Concept[]>('/hyphae/memoirs/search-all', { q }),
  memoirs: () => get<Memoir[]>('/hyphae/memoirs'),
  memory: (id: string) => get<Memory>(`/hyphae/memories/${encodeURIComponent(id)}`),
  recall: (q: string, topic?: string, limit?: number) =>
    get<Memory[]>('/hyphae/recall', { limit: limit ? String(limit) : '', q, topic: topic ?? '' }),
  stats: () => get<Stats>('/hyphae/stats'),
  topicMemories: (topic: string, limit?: number) =>
    get<Memory[]>(`/hyphae/topics/${encodeURIComponent(topic)}/memories`, { limit: limit ? String(limit) : '' }),
  topics: () => get<TopicSummary[]>('/hyphae/topics'),
}

export const myceliumApi = {
  gain: () => get('/mycelium/gain'),
  gainHistory: () => get('/mycelium/gain/history'),
}
