import type { HyphaeAnalytics } from '../types.ts'
import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { logger } from '../logger.ts'

const runCli = createCliRunner(HYPHAE_BIN, 'hyphae')
const ANALYTICS_SCHEMA_VERSION = '1.0'

export class HyphaeAnalyticsCliError extends Error {
  kind: 'invalid_payload' | 'unavailable'

  constructor(message: string, kind: 'invalid_payload' | 'unavailable', options?: { cause?: unknown }) {
    super(message, options)
    this.kind = kind
    this.name = 'HyphaeAnalyticsCliError'
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function isSearchStats(value: unknown): value is NonNullable<HyphaeAnalytics['search_stats']> {
  const record = asRecord(value)
  return (
    !!record && typeof record.empty_results === 'number' && typeof record.hit_rate === 'number' && typeof record.total_searches === 'number'
  )
}

function isHyphaeAnalytics(value: unknown): value is HyphaeAnalytics {
  const record = asRecord(value)
  const importanceDistribution = record ? asRecord(record.importance_distribution) : null
  const lifecycle = record ? asRecord(record.lifecycle) : null
  const memoirStats = record ? asRecord(record.memoir_stats) : null
  const memoryUtilization = record ? asRecord(record.memory_utilization) : null

  return (
    !!record &&
    !!importanceDistribution &&
    typeof importanceDistribution.critical === 'number' &&
    typeof importanceDistribution.ephemeral === 'number' &&
    typeof importanceDistribution.high === 'number' &&
    typeof importanceDistribution.low === 'number' &&
    typeof importanceDistribution.medium === 'number' &&
    !!lifecycle &&
    typeof lifecycle.avg_weight === 'number' &&
    typeof lifecycle.created_last_7d === 'number' &&
    typeof lifecycle.created_last_30d === 'number' &&
    typeof lifecycle.decayed === 'number' &&
    typeof lifecycle.min_weight === 'number' &&
    typeof lifecycle.pruned === 'number' &&
    !!memoirStats &&
    typeof memoirStats.code_memoirs === 'number' &&
    typeof memoirStats.total === 'number' &&
    typeof memoirStats.total_concepts === 'number' &&
    typeof memoirStats.total_links === 'number' &&
    !!memoryUtilization &&
    typeof memoryUtilization.rate === 'number' &&
    typeof memoryUtilization.recalled === 'number' &&
    typeof memoryUtilization.total === 'number' &&
    (record.search_stats === null || isSearchStats(record.search_stats)) &&
    Array.isArray(record.top_topics) &&
    record.top_topics.every((entry) => {
      const topic = asRecord(entry)
      return (
        !!topic &&
        typeof topic.avg_weight === 'number' &&
        typeof topic.count === 'number' &&
        typeof topic.latest_created_at === 'string' &&
        typeof topic.name === 'string'
      )
    })
  )
}

function parseAnalytics(stdout: string): HyphaeAnalytics {
  try {
    const parsed = JSON.parse(stdout) as unknown
    const record = asRecord(parsed)
    if (record && record.schema_version === ANALYTICS_SCHEMA_VERSION && isHyphaeAnalytics(record.analytics)) {
      return record.analytics
    }

    throw new HyphaeAnalyticsCliError('Hyphae analytics returned an invalid payload', 'invalid_payload')
  } catch (err) {
    logger.debug({ err }, 'Failed to parse Hyphae analytics CLI output')
    if (err instanceof HyphaeAnalyticsCliError) throw err
    throw new HyphaeAnalyticsCliError('Failed to parse Hyphae analytics CLI output', 'invalid_payload', { cause: err })
  }
}

async function runAnalyticsCli(): Promise<HyphaeAnalytics> {
  try {
    const stdout = await runCli(['--all-projects', 'analytics'])
    return parseAnalytics(stdout)
  } catch (err) {
    if (err instanceof HyphaeAnalyticsCliError) throw err
    logger.debug({ err }, 'Failed to load Hyphae analytics from CLI')
    throw new HyphaeAnalyticsCliError('Failed to load Hyphae analytics from CLI', 'unavailable', { cause: err })
  }
}

export async function getAnalytics(): Promise<HyphaeAnalytics> {
  return runAnalyticsCli()
}
