import type { CommandHistory, CommandHistoryEntry } from './types.ts'
import { getGainHistory } from './gain.ts'

function toCommandHistoryEntry(entry: {
  command: string
  input_tokens: number
  output_tokens: number
  project_path: string
  saved_tokens: number
  savings_pct: number
  session_id?: string | null
  timestamp: string
}): CommandHistoryEntry {
  return {
    command: entry.command,
    filtered_tokens: entry.output_tokens,
    original_tokens: entry.input_tokens,
    project_path: entry.project_path,
    saved_tokens: entry.saved_tokens,
    savings_pct: entry.savings_pct,
    session_id: entry.session_id ?? null,
    timestamp: entry.timestamp,
  }
}

export async function getCommandHistory(limit = 50, projectPath?: string): Promise<CommandHistory> {
  const result = await getGainHistory('json', { limit, projectPath })
  if ('raw' in result) {
    throw new Error('Mycelium history did not return JSON')
  }

  const commands = (result.history ?? []).map(toCommandHistoryEntry)
  return {
    commands,
    total: result.summary.total_commands,
  }
}
