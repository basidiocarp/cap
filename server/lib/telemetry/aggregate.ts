import type { AggregateTelemetry } from './types.ts'
import { scanAllSessions } from '../usage.ts'
import { mergeCountMaps, mergeFileMaps } from './merge.ts'
import { parseSessionTelemetry } from './parse.ts'

export function aggregateTelemetry(since?: string): AggregateTelemetry {
  const sessions = scanAllSessions(since)
  let allTools: Record<string, number> = {}
  let allFiles: Record<string, { edits: number; reads: number }> = {}
  let allCommands: Record<string, number> = {}
  const projectCounts: Record<string, number> = {}
  const dayMap: Record<string, number> = {}
  let totalMessages = 0
  let totalToolCalls = 0

  for (const session of sessions) {
    const date = session.timestamp.slice(0, 10)
    dayMap[date] = (dayMap[date] ?? 0) + 1
    projectCounts[session.project] = (projectCounts[session.project] ?? 0) + 1
    totalMessages += session.duration_messages

    if (!session._transcriptPath) continue
    const telemetry = parseSessionTelemetry(session._transcriptPath)
    if (!telemetry) continue

    allTools = mergeCountMaps(allTools, telemetry.tools)
    allFiles = mergeFileMaps(allFiles, telemetry.files)
    allCommands = mergeCountMaps(allCommands, telemetry.commands)

    for (const count of Object.values(telemetry.tools)) {
      totalToolCalls += count
    }
  }

  const sessionsByDay = Object.entries(dayMap)
    .map(([date, count]) => ({ count, date }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const mostActiveProject = Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    avg_session_length: sessions.length > 0 ? totalMessages / sessions.length : 0,
    most_active_project: mostActiveProject,
    most_edited_files: Object.entries(allFiles)
      .map(([file, details]) => ({ edits: details.edits, file, reads: details.reads }))
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
