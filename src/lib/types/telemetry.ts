export interface ToolUsage {
  count: number
  tool: string
}

export interface FileActivity {
  edits: number
  file: string
  reads: number
}

export interface CommandUsage {
  command: string
  count: number
}

export interface SessionsByDay {
  count: number
  date: string
}

export interface AggregateTelemetry {
  avg_session_length: number
  most_active_project: string | null
  most_edited_files: FileActivity[]
  most_run_commands: CommandUsage[]
  most_used_tools: ToolUsage[]
  sessions_by_day: SessionsByDay[]
  total_messages: number
  total_sessions: number
  total_tool_calls: number
}
