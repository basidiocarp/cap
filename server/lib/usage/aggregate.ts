import type { SessionUsage, UsageAggregate, UsageTrend } from './types.ts'

export function aggregateUsage(sessions: SessionUsage[]): UsageAggregate {
  if (sessions.length === 0) {
    return {
      avg_cost_per_session: 0,
      cache_hit_rate: 0,
      sessions: 0,
      total_cache_tokens: 0,
      total_cost: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
    }
  }

  let totalCost = 0
  let totalInput = 0
  let totalOutput = 0
  let totalCache = 0

  for (const session of sessions) {
    totalCost += session.estimated_cost
    totalInput += session.input_tokens
    totalOutput += session.output_tokens
    totalCache += session.cache_tokens
  }

  const inputSide = totalInput + totalCache
  return {
    avg_cost_per_session: totalCost / sessions.length,
    cache_hit_rate: inputSide > 0 ? totalCache / inputSide : 0,
    sessions: sessions.length,
    total_cache_tokens: totalCache,
    total_cost: totalCost,
    total_input_tokens: totalInput,
    total_output_tokens: totalOutput,
  }
}

export function usageTrend(sessions: SessionUsage[], days: number): UsageTrend[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const byDay = new Map<string, { cost: number; input: number; output: number; sessions: number }>()

  for (const session of sessions) {
    const date = session.timestamp.slice(0, 10)
    if (date < cutoffStr) continue

    const entry = byDay.get(date) ?? { cost: 0, input: 0, output: 0, sessions: 0 }
    entry.cost += session.estimated_cost
    entry.input += session.input_tokens
    entry.output += session.output_tokens
    entry.sessions++
    byDay.set(date, entry)
  }

  return Array.from(byDay.entries())
    .map(([date, values]) => ({
      cost: values.cost,
      date,
      input_tokens: values.input,
      output_tokens: values.output,
      sessions: values.sessions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
