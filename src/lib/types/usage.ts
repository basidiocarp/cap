export interface SessionUsage {
  cache_tokens: number
  duration_messages: number
  estimated_cost: number
  input_tokens: number
  model: string
  output_tokens: number
  project: string
  session_id: string
  timestamp: string
}

export interface UsageAggregate {
  avg_cost_per_session: number
  cache_hit_rate: number
  sessions: number
  total_cache_tokens: number
  total_cost: number
  total_input_tokens: number
  total_output_tokens: number
}

export interface UsageTrend {
  cost: number
  date: string
  input_tokens: number
  output_tokens: number
  sessions: number
}
