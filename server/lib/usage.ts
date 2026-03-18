import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'

import { logger } from '../logger.ts'

export interface SessionUsage {
  duration_messages: number
  estimated_cost: number
  input_tokens: number
  model: string
  output_tokens: number
  project: string
  session_id: string
  cache_tokens: number
  timestamp: string
  /** Internal: path to the transcript file for re-parsing */
  _transcriptPath?: string
}

export interface UsageAggregate {
  avg_cost_per_session: number
  cache_hit_rate: number
  sessions: number
  total_cost: number
  total_input_tokens: number
  total_output_tokens: number
  total_cache_tokens: number
}

export interface UsageTrend {
  date: string
  cost: number
  input_tokens: number
  output_tokens: number
  sessions: number
}

// Cost per million tokens
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5': { input: 0.8, output: 4 },
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
}

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] ?? PRICING['claude-sonnet-4-6']
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
}

export function parseSessionUsage(transcriptPath: string): SessionUsage | null {
  try {
    const content = readFileSync(transcriptPath, 'utf-8')
    const lines = content.split('\n').filter((l) => l.trim())

    let inputTokens = 0
    let outputTokens = 0
    let cacheTokens = 0
    let messageCount = 0
    let model = 'claude-sonnet-4-6'
    let project = ''
    let sessionId = ''
    let timestamp = ''

    for (const line of lines) {
      try {
        const obj = JSON.parse(line)

        if (!sessionId && obj.sessionId) sessionId = obj.sessionId
        if (!sessionId && obj.uuid) sessionId = obj.uuid
        if (!project && obj.cwd) project = basename(obj.cwd)
        if (!timestamp && obj.timestamp) timestamp = obj.timestamp

        if (obj.message?.model) model = obj.message.model

        const usage = obj.message?.usage
        if (usage) {
          inputTokens += usage.input_tokens ?? 0
          outputTokens += usage.output_tokens ?? 0
          cacheTokens += usage.cache_read_input_tokens ?? 0
          cacheTokens += usage.cache_creation_input_tokens ?? 0
        }

        if (obj.type === 'user' || obj.type === 'assistant') {
          messageCount++
        }
      } catch (err) {
        logger.debug({ err, transcriptPath }, 'Failed to parse transcript line')
      }
    }

    if (messageCount === 0) return null

    return {
      _transcriptPath: transcriptPath,
      cache_tokens: cacheTokens,
      duration_messages: messageCount,
      estimated_cost: estimateCost(model, inputTokens, outputTokens),
      input_tokens: inputTokens,
      model,
      output_tokens: outputTokens,
      project: project || 'unknown',
      session_id: sessionId || basename(transcriptPath, '.jsonl'),
      timestamp: timestamp || new Date().toISOString(),
    }
  } catch (err) {
    logger.debug({ err, transcriptPath }, 'Failed to parse session usage')
    return null
  }
}

export function scanAllSessions(since?: string): SessionUsage[] {
  const sessions: SessionUsage[] = []
  const claudeProjects = join(homedir(), '.claude', 'projects')

  if (!existsSync(claudeProjects)) return sessions

  const sinceTs = since ? new Date(since).getTime() : 0

  try {
    for (const projDir of readdirSync(claudeProjects)) {
      const sessionsDir = join(claudeProjects, projDir, 'sessions')
      if (!existsSync(sessionsDir)) continue

      for (const file of readdirSync(sessionsDir)) {
        if (!file.endsWith('.jsonl')) continue
        const filePath = join(sessionsDir, file)

        if (sinceTs > 0) {
          try {
            const mtime = statSync(filePath).mtime.getTime()
            if (mtime < sinceTs) continue
          } catch {
            continue
          }
        }

        const usage = parseSessionUsage(filePath)
        if (usage) sessions.push(usage)
      }
    }
  } catch {
    // ignore read errors
  }

  sessions.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
  return sessions
}

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

  for (const s of sessions) {
    totalCost += s.estimated_cost
    totalInput += s.input_tokens
    totalOutput += s.output_tokens
    totalCache += s.cache_tokens
  }

  const totalTokens = totalInput + totalOutput + totalCache
  return {
    avg_cost_per_session: totalCost / sessions.length,
    cache_hit_rate: totalTokens > 0 ? totalCache / totalTokens : 0,
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

  for (const s of sessions) {
    const date = s.timestamp.slice(0, 10)
    if (date < cutoffStr) continue
    const entry = byDay.get(date) ?? { cost: 0, input: 0, output: 0, sessions: 0 }
    entry.cost += s.estimated_cost
    entry.input += s.input_tokens
    entry.output += s.output_tokens
    entry.sessions++
    byDay.set(date, entry)
  }

  return Array.from(byDay.entries())
    .map(([date, d]) => ({ cost: d.cost, date, input_tokens: d.input, output_tokens: d.output, sessions: d.sessions }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
