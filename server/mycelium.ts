import { existsSync, readFileSync } from 'node:fs'
import Database from 'better-sqlite3'

import { cachedAsync } from './lib/cache.ts'
import { createCliRunner } from './lib/cli.ts'
import { MYCELIUM_BIN } from './lib/config.ts'
import { appConfigPath, appDataPath } from './lib/platform.ts'
import { logger } from './logger.ts'

const run = createCliRunner(MYCELIUM_BIN, 'mycelium')

interface GainCliOutput {
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

interface CommandHistoryEntry {
  command: string
  filtered_tokens: number
  original_tokens: number
  savings_pct: number
  timestamp: string
}

export interface CommandHistory {
  commands: CommandHistoryEntry[]
  total: number
}

function parseGainOutput(raw: unknown): GainCliOutput {
  if (raw && typeof raw === 'object') return raw as GainCliOutput
  return {}
}

function resolveMyceliumDbPath(): string {
  const envPath = process.env.MYCELIUM_DB_PATH
  if (envPath?.trim()) {
    return envPath
  }

  const configPath = appConfigPath('mycelium')
  if (existsSync(configPath)) {
    try {
      const config = readFileSync(configPath, 'utf-8')
      const match = config.match(/\[tracking\][\s\S]*?database_path\s*=\s*"([^"]+)"/)
      if (match?.[1]) {
        return match[1]
      }
    } catch (err) {
      logger.debug({ configPath, err }, 'Failed to read mycelium config while resolving DB path')
    }
  }

  return appDataPath('mycelium', 'history.db')
}

function getMyceliumDb(): Database.Database | null {
  const dbPath = resolveMyceliumDbPath()
  if (!existsSync(dbPath)) {
    return null
  }

  try {
    return new Database(dbPath, { fileMustExist: true, readonly: true })
  } catch (err) {
    logger.debug({ dbPath, err }, 'Failed to open mycelium history database')
    return null
  }
}

function getCommandAggregates(limit = 10): Array<{
  avg_savings_percent: number
  command: string
  count: number
  tokens_input: number
  tokens_saved: number
}> {
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
      .all(limit) as Array<{
      avg_savings_percent: number
      command: string
      count: number
      tokens_input: number
      tokens_saved: number
    }>
  } catch (err) {
    logger.debug({ err }, 'Failed to query top mycelium commands')
    return []
  } finally {
    db.close()
  }
}

export async function getGain(format: 'json' | 'text' = 'json') {
  const raw = await run(['gain', '--format', format])
  if (format === 'json') {
    try {
      return parseGainOutput(JSON.parse(raw))
    } catch {
      throw new Error('Invalid JSON from mycelium gain')
    }
  }
  return { raw }
}

export async function getGainHistory(format: 'json' | 'text' = 'json') {
  const raw = await run(['gain', '--history', '--format', format])
  if (format === 'json') {
    try {
      return parseGainOutput(JSON.parse(raw))
    } catch {
      throw new Error('Invalid JSON from mycelium gain')
    }
  }
  return { raw }
}

function isGainCliOutput(v: GainCliOutput | { raw: string } | null): v is GainCliOutput {
  return v !== null && !('raw' in v)
}

async function computeAnalytics() {
  try {
    const [gain, daily] = await Promise.allSettled([
      getGain('json'),
      run(['gain', '--daily', '--format', 'json']).then((raw) => parseGainOutput(JSON.parse(raw))),
    ])

    const gainRaw = gain.status === 'fulfilled' ? gain.value : null
    const dailyRaw = daily.status === 'fulfilled' ? daily.value : null
    const gainData = isGainCliOutput(gainRaw) ? gainRaw : null
    const dailyData = isGainCliOutput(dailyRaw) ? dailyRaw : null

    const summary = gainData?.summary ?? dailyData?.summary
    const byDay = dailyData?.daily ?? []
    const commandAggregates = getCommandAggregates(10)

    const savings_by_category = commandAggregates.map((cmd) => ({
      category: cmd.command,
      commands: cmd.count,
      rate: cmd.avg_savings_percent / 100,
      tokens_input: cmd.tokens_input,
      tokens_saved: cmd.tokens_saved,
    }))

    const savings_trend = byDay.map((entry) => ({
      commands: entry.commands,
      date: entry.date,
      tokens_saved: entry.saved_tokens,
    }))

    const totalCommands = summary?.total_commands ?? 0
    const totalInput = summary?.total_input ?? 0
    const totalSaved = summary?.total_saved ?? 0
    const filtered = totalSaved > 0 ? totalCommands : 0
    const passthrough = totalCommands - filtered
    const top_commands = commandAggregates.map((cmd) => ({
      avg_savings_percent: cmd.avg_savings_percent,
      command: cmd.command,
      count: cmd.count,
    }))

    return {
      filter_hit_rate: { filtered, passthrough, rate: totalCommands > 0 ? filtered / totalCommands : 0 },
      savings_by_category,
      savings_trend,
      top_commands,
      total_stats: {
        overall_rate: totalInput > 0 ? totalSaved / totalInput : 0,
        total_commands: totalCommands,
        total_tokens_input: totalInput,
        total_tokens_saved: totalSaved,
      },
    }
  } catch {
    return null
  }
}

export const getAnalytics = cachedAsync(computeAnalytics, 60_000)

export async function getCommandHistory(limit = 50): Promise<CommandHistory> {
  const db = getMyceliumDb()
  if (!db) {
    return { commands: [], total: 0 }
  }

  try {
    const commands = db
      .prepare(
        `SELECT timestamp, mycelium_cmd as command, input_tokens as original_tokens,
                output_tokens as filtered_tokens, savings_pct
         FROM commands
         ORDER BY timestamp DESC
         LIMIT ?`
      )
      .all(limit) as CommandHistoryEntry[]

    const totalRow = db.prepare('SELECT COUNT(*) as count FROM commands').get() as { count: number } | undefined

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
