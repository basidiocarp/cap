import type { SessionTimelineEntry, SessionTimelineRecord } from '../types.ts'
import { getDb } from '../db.ts'
import { logger } from '../logger.ts'
import { sessionLastActivity, tableExists } from './session-records.ts'

interface RecallEventRow {
  id: string
  memory_count: number
  memory_ids: string
  query: string
  recalled_at: string
  session_id: string | null
}

interface OutcomeSignalRow {
  id: string
  occurred_at: string
  recall_event_id: string | null
  session_id: string | null
  signal_type: string
  signal_value: number
  source: string | null
}

function formatOutcomeTitle(signalType: string, _signalValue: number): string {
  switch (signalType) {
    case 'build_passed':
      return 'Build passed'
    case 'correction':
      return 'Correction detected'
    case 'error_free_run':
      return 'Error-free run'
    case 'error_resolved':
      return 'Error resolved'
    case 'explicit_boost':
      return 'Manual boost recorded'
    case 'session_failure':
      return 'Session ended with failures'
    case 'session_success':
      return 'Session completed successfully'
    case 'test_pass':
    case 'test_passed':
      return 'Tests passed'
    case 'tool_error':
      return 'Tool error captured'
    default: {
      const normalized = signalType.replaceAll('_', ' ').trim()
      if (!normalized) return 'Outcome recorded'
      return normalized.charAt(0).toUpperCase() + normalized.slice(1)
    }
  }
}

function recallEventEntry(row: RecallEventRow): SessionTimelineEntry {
  return {
    detail: row.query,
    id: row.id,
    kind: 'recall',
    memory_count: row.memory_count,
    occurred_at: row.recalled_at,
    recall_event_id: row.id,
    signal_type: null,
    signal_value: null,
    source: null,
    title: `Recalled ${row.memory_count} ${row.memory_count === 1 ? 'memory' : 'memories'}`,
  }
}

function outcomeSignalEntry(row: OutcomeSignalRow, linkedRecall?: RecallEventRow): SessionTimelineEntry {
  const detailParts = [linkedRecall?.query, row.source].filter((value): value is string => Boolean(value))

  return {
    detail: detailParts.length > 0 ? detailParts.join(' · ') : null,
    id: row.id,
    kind: 'outcome',
    memory_count: linkedRecall?.memory_count ?? null,
    occurred_at: row.occurred_at,
    recall_event_id: row.recall_event_id,
    signal_type: row.signal_type,
    signal_value: row.signal_value,
    source: row.source,
    title: formatOutcomeTitle(row.signal_type, row.signal_value),
  }
}

function buildRecallEntries(sessionIds: string[]): RecallEventRow[] {
  const db = getDb()
  if (!db || !tableExists('recall_events')) return []

  const placeholders = sessionIds.map(() => '?').join(',')
  return db
    .prepare(
      `SELECT id, session_id, query, recalled_at, memory_ids, memory_count
       FROM recall_events
       WHERE session_id IN (${placeholders})
       ORDER BY recalled_at DESC`
    )
    .all(...sessionIds) as RecallEventRow[]
}

function buildOutcomeEntries(sessionIds: string[]): OutcomeSignalRow[] {
  const db = getDb()
  if (!db || !tableExists('outcome_signals')) return []

  const placeholders = sessionIds.map(() => '?').join(',')
  return db
    .prepare(
      `SELECT id, session_id, recall_event_id, signal_type, signal_value, occurred_at, source
       FROM outcome_signals
       WHERE session_id IN (${placeholders})
       ORDER BY occurred_at DESC`
    )
    .all(...sessionIds) as OutcomeSignalRow[]
}

export function hydrateSessionTimeline(baseTimeline: SessionTimelineRecord[]): SessionTimelineRecord[] {
  const db = getDb()
  if (!db || baseTimeline.length === 0) return baseTimeline
  if (!tableExists('recall_events') && !tableExists('outcome_signals')) return baseTimeline

  const sessionMap = new Map(baseTimeline.map((session) => [session.id, session]))
  const sessionIds = baseTimeline.map((session) => session.id)

  try {
    const recallRows = buildRecallEntries(sessionIds)
    const recallById = new Map(recallRows.map((row) => [row.id, row]))

    for (const row of recallRows) {
      if (!row.session_id) continue
      const session = sessionMap.get(row.session_id)
      if (!session) continue
      session.events.push(recallEventEntry(row))
    }

    const outcomeRows = buildOutcomeEntries(sessionIds)
    for (const row of outcomeRows) {
      if (!row.session_id) continue
      const session = sessionMap.get(row.session_id)
      if (!session) continue
      const linkedRecall = row.recall_event_id ? recallById.get(row.recall_event_id) : undefined
      session.events.push(outcomeSignalEntry(row, linkedRecall))
    }
  } catch (err) {
    logger.debug({ err }, 'Failed to build Hyphae session timeline events')
    return baseTimeline
  }

  return Array.from(sessionMap.values())
    .map((session) => {
      session.events.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      session.recall_count = session.events.filter((event) => event.kind === 'recall').length
      session.outcome_count = session.events.filter((event) => event.kind === 'outcome').length
      session.last_activity_at = sessionLastActivity(
        session,
        session.events.map((event) => event.occurred_at)
      )
      return session
    })
    .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
}
