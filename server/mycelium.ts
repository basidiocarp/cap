import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { logger } from './logger.ts'

const exec = promisify(execFile)

const MYCELIUM_BIN = process.env.MYCELIUM_BIN ?? 'mycelium'

async function run(args: string[]): Promise<string> {
  logger.debug({ args, bin: MYCELIUM_BIN }, 'Executing mycelium CLI')
  const { stdout } = await exec(MYCELIUM_BIN, args, {
    env: { ...process.env, NO_COLOR: '1' },
    timeout: 10_000,
  })
  return stdout.trim()
}

export async function getGain(format: 'json' | 'text' = 'json') {
  const raw = await run(['gain', '--format', format])
  if (format === 'json') {
    return JSON.parse(raw)
  }
  return { raw }
}

export async function getGainHistory(format: 'json' | 'text' = 'json') {
  const raw = await run(['gain', '--history', '--format', format])
  if (format === 'json') {
    return JSON.parse(raw)
  }
  return { raw }
}

// 60-second cache for analytics
let analyticsCache: { data: Awaited<ReturnType<typeof computeAnalytics>>; ts: number } | null = null
const ANALYTICS_TTL = 60_000

async function computeAnalytics() {
  const [gain, history] = await Promise.allSettled([getGain('json'), getGainHistory('json')])

  const gainData = gain.status === 'fulfilled' ? gain.value : null
  const historyData = history.status === 'fulfilled' ? history.value : null

  // Process savings by category from by_command data
  const byCommand = (gainData as any)?.by_command ?? []
  const savings_by_category = byCommand.map((cmd: any[]) => ({
    category: cmd[0] ?? 'unknown',
    commands: 1,
    rate: cmd[3] ?? 0,
    tokens_saved: (cmd[1] ?? 0) - (cmd[2] ?? 0),
  }))

  // Process savings trend from history
  const byDay = (historyData as any)?.by_day ?? (gainData as any)?.by_day ?? []
  const savings_trend = byDay.map((entry: any[]) => ({
    commands: 0,
    date: entry[0],
    tokens_saved: entry[1] ?? 0,
  }))

  // Filter hit rate
  const totalCommands = (gainData as any)?.total_commands ?? 0
  const totalSaved = (gainData as any)?.total_saved ?? 0
  const filtered = totalSaved > 0 ? totalCommands : 0
  const passthrough = totalCommands - filtered

  // Top commands
  const top_commands = byCommand
    .map((cmd: any[]) => ({
      avg_savings: cmd[3] ?? 0,
      command: cmd[0] ?? 'unknown',
      count: 1,
    }))
    .slice(0, 10)

  return {
    filter_hit_rate: { filtered, passthrough, rate: totalCommands > 0 ? filtered / totalCommands : 0 },
    savings_by_category,
    savings_trend,
    top_commands,
  }
}

export async function getAnalytics() {
  if (analyticsCache && Date.now() - analyticsCache.ts < ANALYTICS_TTL) {
    return analyticsCache.data
  }
  const data = await computeAnalytics()
  analyticsCache = { data, ts: Date.now() }
  return data
}
