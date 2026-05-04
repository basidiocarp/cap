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
  source_data: string | null
  related_ids: string
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
  limit: number
  offset: number
  query?: string | null
  total_concepts: number
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

export interface HyphaeAnalytics {
  importance_distribution: { critical: number; ephemeral: number; high: number; low: number; medium: number }
  lifecycle: { avg_weight: number; created_last_7d: number; created_last_30d: number; decayed: number; min_weight: number; pruned: number }
  memoir_stats: { code_memoirs: number; total: number; total_concepts: number; total_links: number }
  memory_utilization: { rate: number; recalled: number; total: number }
  search_stats: { empty_results: number; hit_rate: number; total_searches: number }
  top_topics: { avg_weight: number; count: number; latest_created_at: string; name: string }[]
}

export interface ContextEntry {
  content: string
  relevance: number
  source: string
  symbol?: string
  topic?: string
}

export interface GatherContextResult {
  context: ContextEntry[]
  sources_queried: string[]
  tokens_budget: number
  tokens_used: number
}

export interface IngestionSource {
  chunk_count: number
  last_ingested: string | null
  source_path: string
}

export interface EvaluationPeriodMetric {
  name: string
  previous: string
  recent: string
  trend: 'improving' | 'declining' | 'stable' | 'unknown'
}

export interface EvaluationResult {
  days: number
  half_days: number
  overall_verdict: string
  metrics: EvaluationPeriodMetric[]
  recall_non_zero_rate: string | null
  recall_avg_effectiveness: string | null
}

export interface MemoirGraphNode {
  id: string
  label: string
  definition: string
  memoir_id: string
}

export interface MemoirGraphEdge {
  id: string
  source: string
  target: string
  label: string
}

export interface MemoirGraphData {
  nodes: MemoirGraphNode[]
  edges: MemoirGraphEdge[]
}
