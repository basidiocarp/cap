export interface MemoryRow {
  id: string
  created_at: string
  updated_at: string
  last_accessed: string
  access_count: number
  weight: number
  topic: string
  summary: string
  raw_excerpt: string | null
  keywords: string // JSON array
  importance: string
  source_type: string
  source_data: string | null
  related_ids: string // JSON array
}

export interface MemoirRow {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  consolidation_threshold: number
}

export interface ConceptRow {
  id: string
  memoir_id: string
  name: string
  definition: string
  labels: string // JSON array
  confidence: number
  revision: number
  created_at: string
  updated_at: string
  source_memory_ids: string // JSON array
}

export interface ConceptLinkRow {
  id: string
  source_id: string
  target_id: string
  relation: string
  weight: number
  created_at: string
}

export interface TopicSummary {
  topic: string
  count: number
  avg_weight: number
  newest: string
  oldest: string
}

export interface StatsResult {
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
