export interface SessionUsage {
  cache_tokens: number
  cost_known: boolean
  duration_messages: number
  estimated_cost: number
  input_tokens: number
  model: string
  output_tokens: number
  provider: 'anthropic' | 'openai' | 'unknown'
  project: string
  runtime: 'claude-code' | 'codex'
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
