import type { GainCliOutput } from './types.ts'
import { cachedAsync } from '../lib/cache.ts'
import { getDailyGainOutput, getGain } from './gain.ts'
import { getCommandAggregates } from './history.ts'

function isGainCliOutput(value: GainCliOutput | { raw: string } | null): value is GainCliOutput {
  return value !== null && !('raw' in value)
}

async function computeAnalytics() {
  try {
    const [gain, daily] = await Promise.allSettled([getGain('json'), getDailyGainOutput()])

    const gainRaw = gain.status === 'fulfilled' ? gain.value : null
    const dailyRaw = daily.status === 'fulfilled' ? daily.value : null
    const gainData = isGainCliOutput(gainRaw) ? gainRaw : null
    const dailyData = isGainCliOutput(dailyRaw) ? dailyRaw : null

    const summary = gainData?.summary ?? dailyData?.summary
    const byDay = dailyData?.daily ?? []
    const commandAggregates = getCommandAggregates(10)

    const savings_by_category = commandAggregates.map((command) => ({
      category: command.command,
      commands: command.count,
      rate: command.avg_savings_percent / 100,
      tokens_input: command.tokens_input,
      tokens_saved: command.tokens_saved,
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
    const top_commands = commandAggregates.map((command) => ({
      avg_savings_percent: command.avg_savings_percent,
      command: command.command,
      count: command.count,
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
