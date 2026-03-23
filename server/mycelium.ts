import { cachedAsync } from './lib/cache.ts'
import { createCliRunner } from './lib/cli.ts'
import { MYCELIUM_BIN } from './lib/config.ts'
import { logger } from './logger.ts'

const run = createCliRunner(MYCELIUM_BIN, 'mycelium')

interface GainCliOutput {
  by_command?: [string, number, number, number][]
  by_day?: [string, number][]
  total_commands?: number
  total_input?: number
  total_saved?: number
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
    const [gain, history] = await Promise.allSettled([getGain('json'), getGainHistory('json')])

    const gainRaw = gain.status === 'fulfilled' ? gain.value : null
    const historyRaw = history.status === 'fulfilled' ? history.value : null
    const gainData = isGainCliOutput(gainRaw) ? gainRaw : null
    const historyData = isGainCliOutput(historyRaw) ? historyRaw : null

    const byCommand = gainData?.by_command ?? []
    const savings_by_category = byCommand.map((cmd: [string, number, number, number]) => ({
      category: cmd[0] ?? 'unknown',
      commands: 1,
      rate: cmd[3] ?? 0,
      tokens_input: cmd[1] ?? 0,
      tokens_saved: (cmd[1] ?? 0) - (cmd[2] ?? 0),
    }))

    const byDay = historyData?.by_day ?? gainData?.by_day ?? []
    const savings_trend = byDay.map((entry: [string, number]) => ({
      commands: 0,
      date: entry[0],
      tokens_saved: entry[1] ?? 0,
    }))

    const totalCommands = gainData?.total_commands ?? 0
    const totalInput = gainData?.total_input ?? 0
    const totalSaved = gainData?.total_saved ?? 0
    const filtered = totalSaved > 0 ? totalCommands : 0
    const passthrough = totalCommands - filtered

    const top_commands = byCommand
      .map((cmd: [string, number, number, number]) => ({
        avg_savings_percent: cmd[3] ?? 0,
        command: cmd[0] ?? 'unknown',
        count: 1,
      }))
      .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
      .slice(0, 10)

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
  try {
    const gainHistory = await getGainHistory('json')
    if (!isGainCliOutput(gainHistory)) {
      return { commands: [], total: 0 }
    }

    const byCommand = gainHistory.by_command ?? []
    const commands = byCommand
      .map((cmd: [string, number, number, number]) => ({
        command: cmd[0] ?? 'unknown',
        filtered_tokens: cmd[2] ?? 0,
        original_tokens: cmd[1] ?? 0,
        savings_pct: cmd[3] ?? 0,
        timestamp: new Date().toISOString(), // Note: Mycelium CLI doesn't provide per-command timestamps
      }))
      .slice(0, limit)

    return {
      commands,
      total: commands.length,
    }
  } catch (err) {
    logger.debug({ err }, 'Failed to get command history')
    return { commands: [], total: 0 }
  }
}
