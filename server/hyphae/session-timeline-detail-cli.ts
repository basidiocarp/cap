import type { SessionTimelineDetailEvent, SessionTimelineDetailEventType } from '../types.ts'
import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { callLocalService } from '../lib/local-service.ts'
import { logger } from '../logger.ts'

const runCli = createCliRunner(HYPHAE_BIN, 'hyphae')
const SESSION_TIMELINE_DETAIL_SCHEMA_VERSION = '1.0'

export class HyphaeSessionTimelineDetailCliError extends Error {
  kind: 'invalid_payload' | 'not_found' | 'unavailable'

  constructor(message: string, kind: 'invalid_payload' | 'not_found' | 'unavailable', options?: { cause?: unknown }) {
    super(message, options)
    this.kind = kind
    this.name = 'HyphaeSessionTimelineDetailCliError'
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function isSessionTimelineDetailEventType(value: unknown): value is SessionTimelineDetailEventType {
  return (
    value === 'correction' ||
    value === 'error' ||
    value === 'export' ||
    value === 'recall' ||
    value === 'summary' ||
    value === 'test_fail' ||
    value === 'test_pass'
  )
}

function normalizeLegacyType(raw: Record<string, unknown>): SessionTimelineDetailEventType | null {
  if (raw.kind === 'recall') return 'recall'
  const isOutcome = raw.kind === 'outcome' || raw.type === 'outcome'

  switch (raw.signal_type) {
    case 'correction':
      return 'correction'
    case 'export':
    case 'session_export':
      return 'export'
    case 'build_failed':
    case 'session_failure':
    case 'tool_error':
      return 'error'
    case 'test_failed':
    case 'test_failure':
      return 'test_fail'
    case 'build_passed':
      return 'test_pass'
    case 'error_free_run':
      return 'summary'
    case 'error_resolved':
      return 'correction'
    case 'session_success':
      return 'summary'
    case 'test_passed':
    case 'test_pass':
      return 'test_pass'
    case 'summary':
    case 'session_summary':
      return 'summary'
    default:
      return isOutcome ? 'summary' : null
  }
}

function normalizeEvent(value: unknown): SessionTimelineDetailEvent | null {
  const record = asRecord(value)
  if (!record) return null

  const type = isSessionTimelineDetailEventType(record.type) ? record.type : normalizeLegacyType(record)
  const timestamp =
    typeof record.timestamp === 'string' ? record.timestamp : typeof record.occurred_at === 'string' ? record.occurred_at : null
  const content =
    typeof record.content === 'string'
      ? record.content
      : [typeof record.title === 'string' ? record.title : null, typeof record.detail === 'string' ? record.detail : null]
          .filter((part): part is string => Boolean(part))
          .join(': ')
  const score = typeof record.score === 'number' ? record.score : typeof record.signal_value === 'number' ? record.signal_value : undefined

  if (!type || !timestamp || !content) return null

  return score === undefined ? { content, timestamp, type } : { content, score, timestamp, type }
}

function isEventsArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function parseTimelineRecordEvents(stdout: string, sessionId: string): SessionTimelineDetailEvent[] {
  const parsed = JSON.parse(stdout) as unknown
  const record = asRecord(parsed)
  if (!record || record.schema_version !== SESSION_TIMELINE_DETAIL_SCHEMA_VERSION) {
    throw new HyphaeSessionTimelineDetailCliError('Hyphae session timeline returned an invalid payload', 'invalid_payload')
  }

  if ('events' in record) {
    const rawSessionId = typeof record.session_id === 'string' ? record.session_id : typeof record.id === 'string' ? record.id : null
    if (rawSessionId && rawSessionId !== sessionId) {
      throw new HyphaeSessionTimelineDetailCliError('Hyphae session timeline did not include the requested session', 'not_found')
    }

    if (!isEventsArray(record.events)) {
      throw new HyphaeSessionTimelineDetailCliError('Hyphae session timeline returned an invalid payload', 'invalid_payload')
    }

    const normalized = record.events.map(normalizeEvent)
    if (normalized.some((event) => event === null)) {
      throw new HyphaeSessionTimelineDetailCliError('Hyphae session timeline returned an invalid payload', 'invalid_payload')
    }
    return normalized.filter((event): event is SessionTimelineDetailEvent => event !== null)
  }

  if ('timeline' in record) {
    if (!isEventsArray(record.timeline)) {
      throw new HyphaeSessionTimelineDetailCliError('Hyphae session timeline returned an invalid payload', 'invalid_payload')
    }

    const sessionRecord = record.timeline.find((item) => {
      const entry = asRecord(item)
      const itemId = typeof entry?.id === 'string' ? entry.id : typeof entry?.session_id === 'string' ? entry.session_id : null
      return itemId === sessionId
    })

    if (!sessionRecord) {
      throw new HyphaeSessionTimelineDetailCliError('Hyphae session timeline did not include the requested session', 'not_found')
    }

    const sessionRecordObject = asRecord(sessionRecord)
    if (!sessionRecordObject || !isEventsArray(sessionRecordObject.events)) {
      throw new HyphaeSessionTimelineDetailCliError('Hyphae session timeline returned an invalid payload', 'invalid_payload')
    }

    const normalized = sessionRecordObject.events.map(normalizeEvent)
    if (normalized.some((event) => event === null)) {
      throw new HyphaeSessionTimelineDetailCliError('Hyphae session timeline returned an invalid payload', 'invalid_payload')
    }
    return normalized.filter((event): event is SessionTimelineDetailEvent => event !== null)
  }

  throw new HyphaeSessionTimelineDetailCliError('Hyphae session timeline returned an invalid payload', 'invalid_payload')
}

export async function getSessionTimelineEventsFromCli(sessionId: string): Promise<SessionTimelineDetailEvent[]> {
  try {
    const raw = await callLocalService('hyphae', 'cap_session_timeline', { session_id: sessionId })
    if (raw) {
      return parseTimelineRecordEvents(raw, sessionId)
    }
  } catch (err) {
    if (err instanceof HyphaeSessionTimelineDetailCliError) throw err
    logger.debug({ err }, 'hyphae socket unavailable for getSessionTimelineEventsFromCli, falling back to CLI')
  }
  try {
    const stdout = await runCli(['session', 'timeline', '--session-id', sessionId, '--format', 'json'])
    return parseTimelineRecordEvents(stdout, sessionId)
  } catch (err) {
    if (err instanceof HyphaeSessionTimelineDetailCliError) throw err
    logger.debug({ err }, 'Failed to load Hyphae session timeline events from CLI')
    throw new HyphaeSessionTimelineDetailCliError('Failed to load Hyphae session timeline events from CLI', 'unavailable', { cause: err })
  }
}
