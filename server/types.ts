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
  invalidated_at?: string | null
  invalidation_reason?: string | null
  invalidated_by?: string | null
  is_stale?: boolean | null
  stale_reason?: string | null
  superseded_by_memory_id?: string | null
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

export interface SessionRecord {
  id: string
  project: string
  scope?: string | null
  task: string | null
  started_at: string
  ended_at: string | null
  summary: string | null
  files_modified: string | null
  errors: string | null
  status: string
}

export interface SessionTimelineEntry {
  detail: string | null
  id: string
  kind: 'outcome' | 'recall'
  memory_count: number | null
  occurred_at: string
  recall_event_id: string | null
  signal_type: string | null
  signal_value: number | null
  source: string | null
  title: string
}

export interface SessionTimelineRecord extends SessionRecord {
  events: SessionTimelineEntry[]
  last_activity_at: string
  outcome_count: number
  recall_count: number
}

export interface Lesson {
  id: string
  category: 'corrections' | 'errors' | 'tests'
  description: string
  frequency: number
  source_topics: string[]
  keywords: string[]
}
