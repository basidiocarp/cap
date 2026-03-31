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
  project_root?: string | null
  runtime_session_id?: string | null
  worktree_id?: string | null
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

export interface HyphaeAnalytics {
  importance_distribution: { critical: number; ephemeral: number; high: number; low: number; medium: number }
  lifecycle: { avg_weight: number; created_last_7d: number; created_last_30d: number; decayed: number; min_weight: number; pruned: number }
  memoir_stats: { code_memoirs: number; total: number; total_concepts: number; total_links: number }
  memory_utilization: { rate: number; recalled: number; total: number }
  search_stats: { empty_results: number; hit_rate: number; total_searches: number } | null
  top_topics: { avg_weight: number; count: number; latest_created_at: string; name: string }[]
}
