import { cachedAsync } from './lib/cache.ts'
import { createCliRunner } from './lib/cli.ts'

const run = createCliRunner(process.env.MYCELIUM_BIN ?? 'mycelium', 'mycelium')

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

async function computeAnalytics() {
  const [gain, history] = await Promise.allSettled([getGain('json'), getGainHistory('json')])

  const gainData = gain.status === 'fulfilled' ? gain.value : null
  const historyData = history.status === 'fulfilled' ? history.value : null

  const byCommand = (gainData as any)?.by_command ?? []
  const savings_by_category = byCommand.map((cmd: any[]) => ({
    category: cmd[0] ?? 'unknown',
    commands: 1,
    rate: cmd[3] ?? 0,
    tokens_saved: (cmd[1] ?? 0) - (cmd[2] ?? 0),
  }))

  const byDay = (historyData as any)?.by_day ?? (gainData as any)?.by_day ?? []
  const savings_trend = byDay.map((entry: any[]) => ({
    commands: 0,
    date: entry[0],
    tokens_saved: entry[1] ?? 0,
  }))

  const totalCommands = (gainData as any)?.total_commands ?? 0
  const totalSaved = (gainData as any)?.total_saved ?? 0
  const filtered = totalSaved > 0 ? totalCommands : 0
  const passthrough = totalCommands - filtered

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

export const getAnalytics = cachedAsync(computeAnalytics, 60_000)
