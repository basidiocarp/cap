export interface ToolUsage {
  count: number
  tool: string
}

export interface FileActivity {
  edits: number
  file: string
  reads: number
}

export interface SessionTelemetry {
  commands: Record<string, number>
  duration_messages: number
  files: Record<string, { edits: number; reads: number }>
  project: string
  session_id: string
  timestamp: string
  tools: Record<string, number>
}

export interface AggregateTelemetry {
  avg_session_length: number
  most_active_project: string
  most_edited_files: FileActivity[]
  most_run_commands: { command: string; count: number }[]
  most_used_tools: ToolUsage[]
  sessions_by_day: { count: number; date: string }[]
  total_messages: number
  total_sessions: number
  total_tool_calls: number
}
