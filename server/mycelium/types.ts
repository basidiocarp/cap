export interface GainProjectStats {
  project_path: string
  project_name: string
  commands: number
  saved_tokens: number
  avg_savings_pct: number
  last_used: string
}

export interface GainCliOutput {
  by_command: GainCommandStats[]
  by_project?: GainProjectStats[]
  daily?: GainDailyStats[]
  weekly?: GainDailyStats[]
  monthly?: GainDailyStats[]
  history?: GainHistoryEntry[]
  schema_version: '1.0'
  summary: GainSummary
}

export interface GainSummary {
  avg_savings_pct: number
  avg_time_ms: number
  total_commands: number
  total_input: number
  total_output: number
  total_saved: number
  total_time_ms: number
}

export interface GainDailyStats {
  avg_time_ms: number
  commands: number
  date: string
  input_tokens: number
  output_tokens: number
  saved_tokens: number
  savings_pct: number
  total_time_ms: number
}

export interface GainCommandStats {
  avg_savings_pct: number
  command: string
  count: number
  exec_time_ms: number
  input_tokens: number
  tokens_saved: number
}

export interface GainHistoryEntry {
  command: string
  input_tokens: number
  output_tokens: number
  project_path: string
  saved_tokens: number
  savings_pct: number
  session_id?: string | null
  timestamp: string
}

export interface GainTextResult {
  raw: string
}

export interface GainResult {
  by_command?: GainCommandStats[]
  daily?: GainDailyStats[]
  history?: GainHistoryEntry[]
  schema_version?: '1.0'
  summary?: GainSummary
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
