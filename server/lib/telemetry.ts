import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

import { scanAllSessions } from './usage.ts'

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

export function parseSessionTelemetry(transcriptPath: string): SessionTelemetry | null {
  try {
    const content = readFileSync(transcriptPath, 'utf-8')
    const lines = content.split('\n').filter((l) => l.trim())

    const tools: Record<string, number> = {}
    const files: Record<string, { edits: number; reads: number }> = {}
    const commands: Record<string, number> = {}
    let messageCount = 0
    let project = ''
    let sessionId = ''
    let timestamp = ''

    for (const line of lines) {
      try {
        const obj = JSON.parse(line)

        if (!sessionId && obj.sessionId) sessionId = obj.sessionId
        if (!project && obj.cwd) project = basename(obj.cwd)
        if (!timestamp && obj.timestamp) timestamp = obj.timestamp

        if (obj.type === 'user' || obj.type === 'assistant') messageCount++

        if (obj.message?.content) {
          const contentArr = Array.isArray(obj.message.content) ? obj.message.content : []
          for (const item of contentArr) {
            if (item.type === 'tool_use' && item.name) {
              tools[item.name] = (tools[item.name] ?? 0) + 1

              const input = item.input ?? {}
              if (item.name === 'Edit' || item.name === 'Write' || item.name === 'MultiEdit') {
                const fp = input.file_path
                if (fp) {
                  if (!files[fp]) files[fp] = { edits: 0, reads: 0 }
                  files[fp].edits++
                }
              } else if (item.name === 'Read') {
                const fp = input.file_path
                if (fp) {
                  if (!files[fp]) files[fp] = { edits: 0, reads: 0 }
                  files[fp].reads++
                }
              } else if (item.name === 'Bash') {
                const cmd = input.command
                if (cmd) {
                  const short = cmd.split(/\s+/).slice(0, 3).join(' ')
                  commands[short] = (commands[short] ?? 0) + 1
                }
              }
            }
          }
        }
      } catch {}
    }

    if (messageCount === 0) return null

    return {
      commands,
      duration_messages: messageCount,
      files,
      project: project || 'unknown',
      session_id: sessionId || basename(transcriptPath, '.jsonl'),
      timestamp: timestamp || new Date().toISOString(),
      tools,
    }
  } catch {
    return null
  }
}

export function aggregateTelemetry(since?: string): AggregateTelemetry {
  const sessions = scanAllSessions(since)
  const allTools: Record<string, number> = {}
  const allFiles: Record<string, { edits: number; reads: number }> = {}
  const allCommands: Record<string, number> = {}
  const projectCounts: Record<string, number> = {}
  const dayMap: Record<string, number> = {}
  let totalMessages = 0
  const totalToolCalls = 0

  for (const s of sessions) {
    const date = s.timestamp.slice(0, 10)
    dayMap[date] = (dayMap[date] ?? 0) + 1
    projectCounts[s.project] = (projectCounts[s.project] ?? 0) + 1
    totalMessages += s.duration_messages

    // Parse telemetry from the same session
    // Note: we use the usage sessions which already have parsed data
  }

  // For detailed tool/file/command data we'd need to re-parse transcripts
  // For now return the aggregates we can from usage data
  const sessionsByDay = Object.entries(dayMap)
    .map(([date, count]) => ({ count, date }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const mostActiveProject = Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown'

  return {
    avg_session_length: sessions.length > 0 ? totalMessages / sessions.length : 0,
    most_active_project: mostActiveProject,
    most_edited_files: Object.entries(allFiles)
      .map(([file, { edits, reads }]) => ({ edits, file, reads }))
      .sort((a, b) => b.edits - a.edits)
      .slice(0, 10),
    most_run_commands: Object.entries(allCommands)
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    most_used_tools: Object.entries(allTools)
      .map(([tool, count]) => ({ count, tool }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    sessions_by_day: sessionsByDay,
    total_messages: totalMessages,
    total_sessions: sessions.length,
    total_tool_calls: totalToolCalls,
  }
}
