import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

import type { SessionTelemetry } from './types.ts'

export function parseSessionTelemetry(transcriptPath: string): SessionTelemetry | null {
  try {
    const content = readFileSync(transcriptPath, 'utf-8')
    const lines = content.split('\n').filter((line) => line.trim())

    const tools: Record<string, number> = {}
    const files: Record<string, { edits: number; reads: number }> = {}
    const commands: Record<string, number> = {}
    let messageCount = 0
    let project = ''
    let sessionId = ''
    let timestamp = ''

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as Record<string, unknown>
        const message = typeof entry.message === 'object' && entry.message !== null ? (entry.message as Record<string, unknown>) : null
        const contentArr = Array.isArray(message?.content) ? message.content : []

        if (!sessionId && typeof entry.sessionId === 'string') sessionId = entry.sessionId
        if (!project && typeof entry.cwd === 'string') project = basename(entry.cwd)
        if (!timestamp && typeof entry.timestamp === 'string') timestamp = entry.timestamp

        if (entry.type === 'user' || entry.type === 'assistant') {
          messageCount++
        }

        for (const item of contentArr) {
          if (!item || typeof item !== 'object') continue
          const toolUse = item as Record<string, unknown>
          if (toolUse.type !== 'tool_use' || typeof toolUse.name !== 'string') continue

          tools[toolUse.name] = (tools[toolUse.name] ?? 0) + 1

          const input = typeof toolUse.input === 'object' && toolUse.input !== null ? (toolUse.input as Record<string, unknown>) : {}
          if (toolUse.name === 'Edit' || toolUse.name === 'Write' || toolUse.name === 'MultiEdit') {
            const filePath = typeof input.file_path === 'string' ? input.file_path : null
            if (filePath) {
              if (!files[filePath]) files[filePath] = { edits: 0, reads: 0 }
              files[filePath].edits++
            }
          } else if (toolUse.name === 'Read') {
            const filePath = typeof input.file_path === 'string' ? input.file_path : null
            if (filePath) {
              if (!files[filePath]) files[filePath] = { edits: 0, reads: 0 }
              files[filePath].reads++
            }
          } else if (toolUse.name === 'Bash') {
            const command = typeof input.command === 'string' ? input.command : null
            if (command) {
              const short = command.split(/\s+/).slice(0, 3).join(' ')
              commands[short] = (commands[short] ?? 0) + 1
            }
          }
        }
      } catch {
        // Skip malformed JSON lines
      }
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
