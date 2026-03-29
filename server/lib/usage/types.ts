export type SessionProvider = 'anthropic' | 'openai' | 'unknown'
export type SessionRuntime = 'claude-code' | 'codex'

export interface SessionUsage {
  duration_messages: number
  estimated_cost: number
  input_tokens: number
  model: string
  output_tokens: number
  project: string
  session_id: string
  cache_tokens: number
  cost_known: boolean
  provider: SessionProvider
  runtime: SessionRuntime
  timestamp: string
  _transcriptPath?: string
}

export interface UsageAggregate {
  avg_cost_per_session: number
  cache_hit_rate: number
  sessions: number
  total_cost: number
  total_input_tokens: number
  total_output_tokens: number
  total_cache_tokens: number
}

export interface UsageTrend {
  date: string
  cost: number
  input_tokens: number
  output_tokens: number
  sessions: number
}
