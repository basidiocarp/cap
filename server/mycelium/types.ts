export interface GainCliOutput {
  daily?: Array<{
    avg_time_ms: number
    commands: number
    date: string
    input_tokens: number
    output_tokens: number
    saved_tokens: number
    savings_pct: number
    total_time_ms: number
  }>
  summary?: {
    avg_savings_pct: number
    avg_time_ms: number
    total_commands: number
    total_input: number
    total_output: number
    total_saved: number
    total_time_ms: number
  }
}

export interface CommandHistoryEntry {
  command: string
  filtered_tokens: number
  original_tokens: number
  project_path: string
  saved_tokens: number
  savings_pct: number
  timestamp: string
}

export interface CommandHistory {
  commands: CommandHistoryEntry[]
  total: number
}

export interface CommandAggregateRow {
  avg_savings_percent: number
  command: string
  count: number
  tokens_input: number
  tokens_saved: number
}
