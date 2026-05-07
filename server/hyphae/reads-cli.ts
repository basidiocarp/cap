import type { HealthResult, MemoryRow, StatsResult, TopicSummary } from '../types.ts'
import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { callLocalService } from '../lib/local-service.ts'
import { logger } from '../logger.ts'

const runCli = createCliRunner(HYPHAE_BIN, 'hyphae')
const STATS_SCHEMA_VERSION = '1.0'
const TOPICS_SCHEMA_VERSION = '1.0'
const SEARCH_SCHEMA_VERSION = '1.0'
const MEMORY_LOOKUP_SCHEMA_VERSION = '1.0'
const TOPIC_MEMORIES_SCHEMA_VERSION = '1.0'
const HEALTH_SCHEMA_VERSION = '1.0'
const SOURCES_SCHEMA_VERSION = '1.0'

interface IngestionSource {
  chunk_count: number
  last_ingested: string | null
  source_path: string
}

interface RawStatsPayload {
  avg_weight: number
  newest_memory: string | null
  oldest_memory: string | null
  total_memories: number
  total_topics: number
}

interface RawTopicSummary {
  avg_weight: number
  count: number
  newest: string | null
  oldest: string | null
  topic: string
}

interface RawTopicsPayload {
  topics: RawTopicSummary[]
}

interface RawMemoryBase {
  access_count: number
  created_at: string
  id: string
  importance: string
  invalidated_at?: string | null
  invalidation_reason?: string | null
  keywords: string[]
  last_accessed: string
  project?: string | null
  raw_excerpt: string | null
  related_ids: string[]
  source: RawMemorySource
  summary: string
  superseded_by?: string | null
  topic: string
  updated_at: string
  weight: number
}

interface RawSearchPayload {
  total: number
  results: RawMemoryBase[]
}

interface RawMemoryLookupPayload {
  memory: RawMemoryBase
}

interface RawTopicMemoriesPayload {
  memories: RawMemoryBase[]
}

interface RawHealthTopic {
  avg_weight: number
  count?: number
  critical_count: number
  entry_count: number
  high_count: number
  low_count: number
  low_weight_count: number
  medium_count: number
  topic: string
}

interface RawHealthPayload {
  topics: RawHealthTopic[]
}

interface RawDocumentPayload {
  chunk_count: number
  project?: string | null
  source_path: string
  updated_at: string
}

interface RawSourcesPayload {
  sources: RawDocumentPayload[]
}

type RawMemorySource = { type: 'agent_session'; file_path?: string | null; host: string; session_id: string } | { type: 'manual' }

export class HyphaeReadsCliError extends Error {
  kind: 'invalid_payload' | 'not_found' | 'unavailable'

  constructor(message: string, kind: 'invalid_payload' | 'not_found' | 'unavailable', options?: { cause?: unknown }) {
    super(message, options)
    this.kind = kind
    this.name = 'HyphaeReadsCliError'
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function isRawMemorySource(value: unknown): value is RawMemorySource {
  const record = asRecord(value)
  if (!record || typeof record.type !== 'string') return false
  if (record.type === 'manual') return true
  return (
    record.type === 'agent_session' &&
    typeof record.host === 'string' &&
    typeof record.session_id === 'string' &&
    (record.file_path === undefined || isNullableString(record.file_path))
  )
}

function isRawMemory(value: unknown): value is RawMemoryBase {
  const record = asRecord(value)
  return (
    !!record &&
    typeof record.id === 'string' &&
    typeof record.created_at === 'string' &&
    typeof record.updated_at === 'string' &&
    typeof record.last_accessed === 'string' &&
    typeof record.access_count === 'number' &&
    typeof record.weight === 'number' &&
    typeof record.topic === 'string' &&
    typeof record.summary === 'string' &&
    isNullableString(record.raw_excerpt) &&
    isStringArray(record.keywords) &&
    typeof record.importance === 'string' &&
    isRawMemorySource(record.source) &&
    isStringArray(record.related_ids) &&
    (record.project === undefined || isNullableString(record.project)) &&
    (record.invalidated_at === undefined || isNullableString(record.invalidated_at)) &&
    (record.invalidation_reason === undefined || isNullableString(record.invalidation_reason)) &&
    (record.superseded_by === undefined || isNullableString(record.superseded_by))
  )
}

function isRawStatsPayload(value: unknown): value is RawStatsPayload {
  const record = asRecord(value)
  return (
    !!record &&
    typeof record.total_memories === 'number' &&
    typeof record.total_topics === 'number' &&
    typeof record.avg_weight === 'number' &&
    isNullableString(record.oldest_memory) &&
    isNullableString(record.newest_memory)
  )
}

function isRawTopicsPayload(value: unknown): value is RawTopicsPayload {
  const record = asRecord(value)
  return (
    !!record &&
    Array.isArray(record.topics) &&
    record.topics.every((entry) => {
      const topic = asRecord(entry)
      return (
        !!topic &&
        typeof topic.topic === 'string' &&
        typeof topic.count === 'number' &&
        typeof topic.avg_weight === 'number' &&
        isNullableString(topic.oldest) &&
        isNullableString(topic.newest)
      )
    })
  )
}

function isRawSearchPayload(value: unknown): value is RawSearchPayload {
  const record = asRecord(value)
  return !!record && typeof record.total === 'number' && Array.isArray(record.results) && record.results.every(isRawMemory)
}

function isRawMemoryLookupPayload(value: unknown): value is RawMemoryLookupPayload {
  const record = asRecord(value)
  return !!record && isRawMemory(record.memory)
}

function isRawTopicMemoriesPayload(value: unknown): value is RawTopicMemoriesPayload {
  const record = asRecord(value)
  return !!record && Array.isArray(record.memories) && record.memories.every(isRawMemory)
}

function isRawHealthPayload(value: unknown): value is RawHealthPayload {
  const record = asRecord(value)
  return (
    !!record &&
    Array.isArray(record.topics) &&
    record.topics.every((entry) => {
      const topic = asRecord(entry)
      return (
        !!topic &&
        typeof topic.topic === 'string' &&
        typeof topic.entry_count === 'number' &&
        typeof topic.avg_weight === 'number' &&
        typeof topic.low_weight_count === 'number' &&
        typeof topic.critical_count === 'number' &&
        typeof topic.high_count === 'number' &&
        typeof topic.medium_count === 'number' &&
        typeof topic.low_count === 'number'
      )
    })
  )
}

function isRawSourcesPayload(value: unknown): value is RawSourcesPayload {
  const record = asRecord(value)
  return (
    !!record &&
    Array.isArray(record.sources) &&
    record.sources.every((entry) => {
      const source = asRecord(entry)
      return (
        !!source &&
        typeof source.source_path === 'string' &&
        typeof source.chunk_count === 'number' &&
        typeof source.updated_at === 'string' &&
        (source.project === undefined || isNullableString(source.project))
      )
    })
  )
}

function parseJson<T>(stdout: string, validator: (value: unknown) => value is T, label: string): T {
  try {
    const parsed = JSON.parse(stdout) as unknown
    const record = asRecord(parsed)
    if (!record || typeof record.schema_version !== 'string') {
      throw new HyphaeReadsCliError(`Hyphae ${label} returned an invalid payload`, 'invalid_payload')
    }
    if (!validator(parsed)) {
      throw new HyphaeReadsCliError(`Hyphae ${label} returned an invalid payload`, 'invalid_payload')
    }
    return parsed
  } catch (err) {
    logger.debug({ err }, `Failed to parse Hyphae ${label} CLI output`)
    if (err instanceof HyphaeReadsCliError) throw err
    throw new HyphaeReadsCliError(`Failed to parse Hyphae ${label} CLI output`, 'invalid_payload', { cause: err })
  }
}

function errorText(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err)
  const maybe = err as { message?: string; stderr?: string }
  return [maybe.stderr, maybe.message].filter((value): value is string => Boolean(value)).join('\n')
}

function memoryNotFound(err: unknown): boolean {
  return /memory not found/i.test(errorText(err))
}

function topicNotFound(err: unknown): boolean {
  return /topic:/i.test(errorText(err)) || /topic not found/i.test(errorText(err))
}

async function runReadsCli(args: string[], label: string): Promise<string> {
  try {
    return await runCli(args)
  } catch (err) {
    logger.debug({ err }, `Failed to load Hyphae ${label} from CLI`)
    throw new HyphaeReadsCliError(`Failed to load Hyphae ${label} from CLI`, 'unavailable', { cause: err })
  }
}

function toMemoryRow(memory: RawMemoryBase): MemoryRow {
  return {
    access_count: memory.access_count,
    created_at: memory.created_at,
    id: memory.id,
    importance: memory.importance,
    invalidated_at: memory.invalidated_at ?? null,
    invalidated_by: null,
    invalidation_reason: memory.invalidation_reason ?? null,
    is_stale: null,
    keywords: JSON.stringify(memory.keywords),
    last_accessed: memory.last_accessed,
    raw_excerpt: memory.raw_excerpt,
    related_ids: JSON.stringify(memory.related_ids),
    source_data:
      memory.source.type === 'agent_session'
        ? JSON.stringify({
            file_path: memory.source.file_path ?? null,
            host: memory.source.host,
            session_id: memory.source.session_id,
          })
        : null,
    source_type: memory.source.type,
    stale_reason: null,
    summary: memory.summary,
    superseded_by_memory_id: memory.superseded_by ?? null,
    topic: memory.topic,
    updated_at: memory.updated_at,
    weight: memory.weight,
  }
}

function compareTopicsByCountDesc(left: TopicSummary, right: TopicSummary): number {
  if (left.count !== right.count) return right.count - left.count
  return left.topic.localeCompare(right.topic)
}

function compareHealthByCountDesc(left: HealthResult, right: HealthResult): number {
  if (left.count !== right.count) return right.count - left.count
  return left.topic.localeCompare(right.topic)
}

function compareSourcesByLastIngestedDesc(left: IngestionSource, right: IngestionSource): number {
  if (left.last_ingested === right.last_ingested) return left.source_path.localeCompare(right.source_path)
  if (!left.last_ingested) return 1
  if (!right.last_ingested) return -1
  return right.last_ingested.localeCompare(left.last_ingested)
}

export async function getStatsFromCli(): Promise<StatsResult> {
  try {
    const raw = await callLocalService('hyphae', 'cap_stats', { include_invalidated: true })
    if (raw) {
      const payload = parseJson(raw, isRawStatsPayload, 'stats')
      if ((payload as { schema_version?: string }).schema_version === STATS_SCHEMA_VERSION) {
        return {
          avg_weight: payload.avg_weight,
          newest: payload.newest_memory,
          oldest: payload.oldest_memory,
          total_memories: payload.total_memories,
          total_topics: payload.total_topics,
        }
      }
    }
  } catch (err) {
    logger.debug({ err }, 'hyphae socket unavailable for getStatsFromCli, falling back to CLI')
  }
  const stdout = await runReadsCli(['--all-projects', 'stats', '--include-invalidated', '--json'], 'stats')
  const payload = parseJson(stdout, isRawStatsPayload, 'stats')
  if ((payload as { schema_version?: string }).schema_version !== STATS_SCHEMA_VERSION) {
    throw new HyphaeReadsCliError('Hyphae stats returned an invalid payload', 'invalid_payload')
  }
  return {
    avg_weight: payload.avg_weight,
    newest: payload.newest_memory,
    oldest: payload.oldest_memory,
    total_memories: payload.total_memories,
    total_topics: payload.total_topics,
  }
}

export async function getTopicsFromCli(): Promise<TopicSummary[]> {
  try {
    const raw = await callLocalService('hyphae', 'cap_topics', { include_invalidated: true })
    if (raw) {
      const payload = parseJson(raw, isRawTopicsPayload, 'topics')
      if ((payload as { schema_version?: string }).schema_version === TOPICS_SCHEMA_VERSION) {
        return payload.topics
          .map((topic) => ({
            avg_weight: topic.avg_weight,
            count: topic.count,
            newest: topic.newest ?? '',
            oldest: topic.oldest ?? '',
            topic: topic.topic,
          }))
          .sort(compareTopicsByCountDesc)
      }
    }
  } catch (err) {
    logger.debug({ err }, 'hyphae socket unavailable for getTopicsFromCli, falling back to CLI')
  }
  const stdout = await runReadsCli(['--all-projects', 'topics', '--include-invalidated', '--json'], 'topics')
  const payload = parseJson(stdout, isRawTopicsPayload, 'topics')
  if ((payload as { schema_version?: string }).schema_version !== TOPICS_SCHEMA_VERSION) {
    throw new HyphaeReadsCliError('Hyphae topics returned an invalid payload', 'invalid_payload')
  }
  return payload.topics
    .map((topic) => ({
      avg_weight: topic.avg_weight,
      count: topic.count,
      newest: topic.newest ?? '',
      oldest: topic.oldest ?? '',
      topic: topic.topic,
    }))
    .sort(compareTopicsByCountDesc)
}

export async function recallFromCli(query: string, topic?: string, limit = 20): Promise<MemoryRow[]> {
  try {
    const params: Record<string, unknown> = { include_invalidated: true, limit, query }
    if (topic) {
      params.topic = topic
    }
    const raw = await callLocalService('hyphae', 'cap_search', params)
    if (raw) {
      const payload = parseJson(raw, isRawSearchPayload, 'search')
      if ((payload as { schema_version?: string }).schema_version === SEARCH_SCHEMA_VERSION) {
        return payload.results.map(toMemoryRow)
      }
    }
  } catch (err) {
    logger.debug({ err }, 'hyphae socket unavailable for recallFromCli, falling back to CLI')
  }
  const args = [
    '--all-projects',
    'search',
    '--query',
    query,
    '--limit',
    String(limit),
    '--include-invalidated',
    '--order',
    'rank',
    '--json',
  ]
  if (topic) {
    args.push('--topic', topic)
  }
  const stdout = await runReadsCli(args, 'search')
  const payload = parseJson(stdout, isRawSearchPayload, 'search')
  if ((payload as { schema_version?: string }).schema_version !== SEARCH_SCHEMA_VERSION) {
    throw new HyphaeReadsCliError('Hyphae search returned an invalid payload', 'invalid_payload')
  }
  return payload.results.map(toMemoryRow)
}

export async function searchGlobalFromCli(query: string, limit = 20): Promise<Array<MemoryRow & { project?: string }>> {
  try {
    const raw = await callLocalService('hyphae', 'cap_search_all', { include_invalidated: true, limit, query })
    if (raw) {
      const payload = parseJson(raw, isRawSearchPayload, 'search')
      if ((payload as { schema_version?: string }).schema_version === SEARCH_SCHEMA_VERSION) {
        return payload.results.map((memory) => ({
          ...toMemoryRow(memory),
          project: memory.project ?? undefined,
        }))
      }
    }
  } catch (err) {
    logger.debug({ err }, 'hyphae socket unavailable for searchGlobalFromCli, falling back to CLI')
  }
  const stdout = await runReadsCli(
    ['--all-projects', 'search', '--query', query, '--limit', String(limit), '--include-invalidated', '--order', 'weight', '--json'],
    'search'
  )
  const payload = parseJson(stdout, isRawSearchPayload, 'search')
  if ((payload as { schema_version?: string }).schema_version !== SEARCH_SCHEMA_VERSION) {
    throw new HyphaeReadsCliError('Hyphae search returned an invalid payload', 'invalid_payload')
  }
  return payload.results.map((memory) => ({
    ...toMemoryRow(memory),
    project: memory.project ?? undefined,
  }))
}

export async function getMemoryFromCli(id: string): Promise<MemoryRow | undefined> {
  try {
    const stdout = await runReadsCli(['--all-projects', 'memory', 'get', id, '--json'], 'memory lookup')
    const payload = parseJson(stdout, isRawMemoryLookupPayload, 'memory lookup')
    if ((payload as { schema_version?: string }).schema_version !== MEMORY_LOOKUP_SCHEMA_VERSION) {
      throw new HyphaeReadsCliError('Hyphae memory lookup returned an invalid payload', 'invalid_payload')
    }
    return toMemoryRow(payload.memory)
  } catch (err) {
    if (err instanceof HyphaeReadsCliError && err.kind === 'unavailable' && memoryNotFound(err.cause)) {
      return undefined
    }
    throw err
  }
}

export async function getMemoriesByTopicFromCli(topic: string, limit = 50): Promise<MemoryRow[]> {
  const stdout = await runReadsCli(
    ['--all-projects', 'memory', 'topic', topic, '--limit', String(limit), '--include-invalidated', '--json'],
    'topic memories'
  )
  const payload = parseJson(stdout, isRawTopicMemoriesPayload, 'topic memories')
  if ((payload as { schema_version?: string }).schema_version !== TOPIC_MEMORIES_SCHEMA_VERSION) {
    throw new HyphaeReadsCliError('Hyphae topic memories returned an invalid payload', 'invalid_payload')
  }
  return payload.memories
    .slice()
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .map(toMemoryRow)
}

export async function getHealthFromCli(topic?: string): Promise<HealthResult[]> {
  try {
    const params: Record<string, unknown> = { include_invalidated: true }
    if (topic) {
      params.topic = topic
    }
    const raw = await callLocalService('hyphae', 'cap_health', params)
    if (raw) {
      const payload = parseJson(raw, isRawHealthPayload, 'health')
      if ((payload as { schema_version?: string }).schema_version === HEALTH_SCHEMA_VERSION) {
        return payload.topics
          .map((entry) => ({
            avg_weight: entry.avg_weight,
            count: entry.entry_count,
            critical_count: entry.critical_count,
            high_count: entry.high_count,
            low_count: entry.low_count,
            low_weight_count: entry.low_weight_count,
            medium_count: entry.medium_count,
            topic: entry.topic,
          }))
          .sort(compareHealthByCountDesc)
      }
    }
  } catch (err) {
    logger.debug({ err }, 'hyphae socket unavailable for getHealthFromCli, falling back to CLI')
  }
  const args = ['--all-projects', 'health', '--include-invalidated', '--json']
  if (topic) {
    args.push('--topic', topic)
  }
  try {
    const stdout = await runReadsCli(args, 'health')
    const payload = parseJson(stdout, isRawHealthPayload, 'health')
    if ((payload as { schema_version?: string }).schema_version !== HEALTH_SCHEMA_VERSION) {
      throw new HyphaeReadsCliError('Hyphae health returned an invalid payload', 'invalid_payload')
    }
    return payload.topics
      .map((entry) => ({
        avg_weight: entry.avg_weight,
        count: entry.entry_count,
        critical_count: entry.critical_count,
        high_count: entry.high_count,
        low_count: entry.low_count,
        low_weight_count: entry.low_weight_count,
        medium_count: entry.medium_count,
        topic: entry.topic,
      }))
      .sort(compareHealthByCountDesc)
  } catch (err) {
    if (topic && err instanceof HyphaeReadsCliError && err.kind === 'unavailable' && topicNotFound(err.cause)) {
      return []
    }
    throw err
  }
}

export async function getIngestionSourcesFromCli(): Promise<IngestionSource[]> {
  const stdout = await runReadsCli(['--all-projects', 'list-sources', '--json'], 'ingestion sources')
  const payload = parseJson(stdout, isRawSourcesPayload, 'ingestion sources')
  if ((payload as { schema_version?: string }).schema_version !== SOURCES_SCHEMA_VERSION) {
    throw new HyphaeReadsCliError('Hyphae ingestion sources returned an invalid payload', 'invalid_payload')
  }
  const groupedSources = new Map<string, IngestionSource>()

  for (const source of payload.sources) {
    const existing = groupedSources.get(source.source_path)
    if (!existing) {
      groupedSources.set(source.source_path, {
        chunk_count: source.chunk_count,
        last_ingested: source.updated_at,
        source_path: source.source_path,
      })
      continue
    }

    existing.chunk_count += source.chunk_count
    if (!existing.last_ingested || source.updated_at.localeCompare(existing.last_ingested) > 0) {
      existing.last_ingested = source.updated_at
    }
  }

  return Array.from(groupedSources.values()).sort(compareSourcesByLastIngestedDesc)
}
