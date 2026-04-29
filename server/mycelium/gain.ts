import type {
  GainCliOutput,
  GainCommandStats,
  GainDailyStats,
  GainHistoryEntry,
  GainProjectStats,
  GainSummary,
  GainTextResult,
} from './types.ts'
import { createCliRunner } from '../lib/cli.ts'
import { MYCELIUM_BIN } from '../lib/config.ts'
import { logger } from '../logger.ts'

const run = createCliRunner(MYCELIUM_BIN, 'mycelium')

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function isGainSummary(value: unknown): value is GainSummary {
  const record = asRecord(value)
  return (
    !!record &&
    typeof record.avg_savings_pct === 'number' &&
    typeof record.avg_time_ms === 'number' &&
    typeof record.total_commands === 'number' &&
    typeof record.total_input === 'number' &&
    typeof record.total_output === 'number' &&
    typeof record.total_saved === 'number' &&
    typeof record.total_time_ms === 'number'
  )
}

function isGainDailyStats(value: unknown): value is GainDailyStats {
  const record = asRecord(value)
  return (
    !!record &&
    typeof record.avg_time_ms === 'number' &&
    typeof record.commands === 'number' &&
    typeof record.date === 'string' &&
    typeof record.input_tokens === 'number' &&
    typeof record.output_tokens === 'number' &&
    typeof record.saved_tokens === 'number' &&
    typeof record.savings_pct === 'number' &&
    typeof record.total_time_ms === 'number'
  )
}

function isGainCommandStats(value: unknown): value is GainCommandStats {
  const record = asRecord(value)
  return (
    !!record &&
    typeof record.avg_savings_pct === 'number' &&
    typeof record.command === 'string' &&
    typeof record.count === 'number' &&
    typeof record.exec_time_ms === 'number' &&
    typeof record.input_tokens === 'number' &&
    typeof record.tokens_saved === 'number'
  )
}

function isGainHistoryEntry(value: unknown): value is GainHistoryEntry {
  const record = asRecord(value)
  return (
    !!record &&
    typeof record.command === 'string' &&
    typeof record.input_tokens === 'number' &&
    typeof record.output_tokens === 'number' &&
    typeof record.project_path === 'string' &&
    typeof record.saved_tokens === 'number' &&
    typeof record.savings_pct === 'number' &&
    (record.session_id === undefined || record.session_id === null || typeof record.session_id === 'string') &&
    typeof record.timestamp === 'string'
  )
}

function isGainProjectStats(value: unknown): value is GainProjectStats {
  const record = asRecord(value)
  return (
    !!record &&
    typeof record.project_path === 'string' &&
    typeof record.commands === 'number' &&
    typeof record.saved_tokens === 'number' &&
    typeof record.avg_savings_pct === 'number' &&
    typeof record.last_used === 'string'
  )
}

export function isGainCliOutput(value: unknown): value is GainCliOutput {
  const record = asRecord(value)
  return (
    !!record &&
    record.schema_version === '1.0' &&
    isGainSummary(record.summary) &&
    Array.isArray(record.by_command) &&
    record.by_command.every(isGainCommandStats) &&
    (record.daily === undefined || (Array.isArray(record.daily) && record.daily.every(isGainDailyStats))) &&
    (record.history === undefined || (Array.isArray(record.history) && record.history.every(isGainHistoryEntry))) &&
    (record.by_project === undefined || (Array.isArray(record.by_project) && record.by_project.every(isGainProjectStats))) &&
    (record.weekly === undefined || (Array.isArray(record.weekly) && record.weekly.every(isGainDailyStats))) &&
    (record.monthly === undefined || (Array.isArray(record.monthly) && record.monthly.every(isGainDailyStats)))
  )
}

function parseGainOutput(raw: string): GainCliOutput {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (isGainCliOutput(parsed)) return parsed
    throw new Error('Mycelium gain returned an invalid payload')
  } catch (err) {
    logger.debug({ err }, 'Failed to parse Mycelium gain CLI output')
    throw new Error('Failed to parse Mycelium gain CLI output')
  }
}

export async function getGain(
  format: 'json' | 'text' = 'json',
  options?: { projectPath?: string }
): Promise<GainCliOutput | GainTextResult> {
  const args = ['gain', '--format', format]
  if (options?.projectPath?.trim()) {
    args.splice(1, 0, '--project-path', options.projectPath.trim())
  }
  const raw = await run(args)
  if (format === 'json') return parseGainOutput(raw)
  return { raw }
}

export async function getGainHistory(
  format: 'json' | 'text' = 'json',
  options: { limit?: number; projectPath?: string } = {}
): Promise<GainCliOutput | GainTextResult> {
  const args = ['gain', '--history', '--limit', String(options.limit ?? 50), '--format', format]
  if (options.projectPath?.trim()) {
    args.splice(1, 0, '--project-path', options.projectPath.trim())
  }

  const raw = await run(args)
  if (format === 'json') return parseGainOutput(raw)
  return { raw }
}

export async function getDailyGainOutput(): Promise<GainCliOutput | null> {
  try {
    const raw = await run(['gain', '--daily', '--format', 'json'])
    return parseGainOutput(raw)
  } catch (err) {
    logger.debug({ err }, 'Failed to load Mycelium daily gain output')
    return null
  }
}

export async function getProjectsGain(): Promise<GainProjectStats[]> {
  try {
    const raw = await run(['gain', '--projects', '--format', 'json'])
    const parsed = parseGainOutput(raw)
    return parsed.by_project ?? []
  } catch (err) {
    logger.debug({ err }, 'Failed to load Mycelium projects gain output')
    return []
  }
}
