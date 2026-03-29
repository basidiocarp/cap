import type { CommandAggregateRow, CommandHistory, CommandHistoryEntry } from './types.ts'
import { logger } from '../logger.ts'
import { getMyceliumDb } from './db.ts'

export function getCommandAggregates(limit = 10): CommandAggregateRow[] {
  const db = getMyceliumDb()
  if (!db) return []

  try {
    return db
      .prepare(
        `SELECT mycelium_cmd as command,
                COUNT(*) as count,
                AVG(savings_pct) as avg_savings_percent,
                SUM(input_tokens) as tokens_input,
                SUM(saved_tokens) as tokens_saved
         FROM commands
         GROUP BY mycelium_cmd
         ORDER BY count DESC, SUM(saved_tokens) DESC
         LIMIT ?`
      )
      .all(limit) as CommandAggregateRow[]
  } catch (err) {
    logger.debug({ err }, 'Failed to query top mycelium commands')
    return []
  } finally {
    db.close()
  }
}

function projectHistoryParams(projectPath?: string): [string | null, string | null] {
  if (!projectPath?.trim()) return [null, null]
  const trimmed = projectPath.trim().replace(/[\\/]+$/, '')
  return [trimmed, `${trimmed}/*`]
}

export async function getCommandHistory(limit = 50, projectPath?: string): Promise<CommandHistory> {
  const db = getMyceliumDb()
  if (!db) {
    return { commands: [], total: 0 }
  }

  try {
    const [projectExact, projectGlob] = projectHistoryParams(projectPath)
    const commands = db
      .prepare(
        `SELECT timestamp,
                mycelium_cmd as command,
                project_path,
                input_tokens as original_tokens,
                output_tokens as filtered_tokens,
                saved_tokens,
                savings_pct
         FROM commands
         WHERE (?1 IS NULL OR project_path = ?1 OR project_path GLOB ?2)
         ORDER BY timestamp DESC
         LIMIT ?3`
      )
      .all(projectExact, projectGlob, limit) as CommandHistoryEntry[]

    const totalRow = db
      .prepare(
        `SELECT COUNT(*) as count
         FROM commands
         WHERE (?1 IS NULL OR project_path = ?1 OR project_path GLOB ?2)`
      )
      .get(projectExact, projectGlob) as { count: number } | undefined

    return {
      commands,
      total: totalRow?.count ?? commands.length,
    }
  } catch (err) {
    logger.debug({ err }, 'Failed to get command history')
    return { commands: [], total: 0 }
  } finally {
    db.close()
  }
}
