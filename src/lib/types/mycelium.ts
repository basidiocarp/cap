export interface MyceliumAnalytics {
  filter_hit_rate: { filtered: number; passthrough: number; rate: number }
  savings_by_category: { category: string; commands: number; rate: number; tokens_input: number; tokens_saved: number }[]
  savings_trend: { commands: number; date: string; tokens_saved: number }[]
  top_commands: { avg_savings_percent: number; command: string; count: number }[]
  total_stats: { overall_rate: number; total_commands: number; total_tokens_input: number; total_tokens_saved: number }
}

export interface ProjectGainStats {
  project_path: string
  commands: number
  saved_tokens: number
  avg_savings_pct: number
  last_used: string
}

export interface GainResult {
  avg_savings_pct?: number
  by_command?: [string, number, number, number][]
  by_project?: ProjectGainStats[]
  history?: Array<{
    command: string
    input_tokens: number
    output_tokens: number
    project_path: string
    saved_tokens: number
    savings_pct: number
    session_id?: string | null
    timestamp: string
  }>
  schema_version?: string
  summary?: {
    avg_savings_pct: number
    avg_time_ms: number
    total_commands: number
    total_input: number
    total_output: number
    total_saved: number
    total_time_ms: number
  }
  total_commands?: number
  total_input?: number
  total_saved?: number
}

export interface CommandHistoryEntry {
  command: string
  filtered_tokens: number
  original_tokens: number
  project_path: string
  saved_tokens: number
  savings_pct: number
  session_id?: string | null
  timestamp: string
}

export interface CommandHistory {
  commands: CommandHistoryEntry[]
  total: number
}
