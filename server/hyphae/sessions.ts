import type { MemoryRow, SessionRecord, SessionTimelineEntry, SessionTimelineRecord } from '../types.ts'
import { getDb } from '../db.ts'
import { logger } from '../logger.ts'

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

function hasTable(name: string): boolean {
  const db = getDb()
  if (!db) return false

  try {
    const row = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) as { count: number }
    return row.count > 0
  } catch {
    return false
  }
}

function querySessions(project?: string, limit = 20): SessionRecord[] {
  const db = getDb()
  if (!db) return []

  try {
    let sql = 'SELECT * FROM sessions'
    const params: string[] = []

    if (project) {
      sql += ' WHERE project = ?'
      params.push(project)
    }

    sql += ' ORDER BY started_at DESC LIMIT ?'
    params.push(String(limit))

    return db.prepare(sql).all(...params) as SessionRecord[]
  } catch {
    if (!project) return []

    const memories = db
      .prepare(
        `SELECT m.* FROM memories m
         WHERE m.topic = ?
         ORDER BY m.created_at DESC
         LIMIT ?`
      )
      .all(`session/${project}`, limit) as MemoryRow[]

    return memories.map((memory): SessionRecord => {
      const sourceData = memory.source_data ? (JSON.parse(memory.source_data) as Record<string, unknown>) : {}
      return {
        ended_at: (sourceData.ended_at as string) || null,
        errors: (sourceData.errors as string) || null,
        files_modified: (sourceData.files_modified as string) || null,
        id: memory.id,
        project,
        scope: null,
        started_at: memory.created_at,
        status: (sourceData.status as string) || 'completed',
        summary: memory.summary,
        task: (sourceData.task as string) || null,
      }
    })
  }
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

function sessionLastActivity(session: SessionRecord, events: SessionTimelineEntry[]): string {
  const timestamps = [session.started_at, session.ended_at, ...events.map((event) => event.occurred_at)].filter((value): value is string =>
    Boolean(value)
  )

  return timestamps.reduce((latest, value) => {
    if (!latest) return value
    return new Date(value).getTime() > new Date(latest).getTime() ? value : latest
  }, session.started_at)
}

export function getSessions(project?: string, limit = 20): SessionRecord[] {
  return querySessions(project, limit)
}

export function getSessionTimeline(project?: string, limit = 20): SessionTimelineRecord[] {
  const db = getDb()
  if (!db) return []

  const sessions = querySessions(project, limit)
  if (sessions.length === 0) return []

  const baseTimeline = sessions.map(
    (session): SessionTimelineRecord => ({
      ...session,
      events: [],
      last_activity_at: session.ended_at ?? session.started_at,
      outcome_count: 0,
      recall_count: 0,
    })
  )

  if (!hasTable('recall_events') && !hasTable('outcome_signals')) {
    return baseTimeline
  }

  const sessionMap = new Map(baseTimeline.map((session) => [session.id, session]))
  const sessionIds = baseTimeline.map((session) => session.id)
  const placeholders = sessionIds.map(() => '?').join(',')

  try {
    const recallRows = hasTable('recall_events')
      ? (db
          .prepare(
            `SELECT id, session_id, query, recalled_at, memory_ids, memory_count
             FROM recall_events
             WHERE session_id IN (${placeholders})
             ORDER BY recalled_at DESC`
          )
          .all(...sessionIds) as RecallEventRow[])
      : []

    const recallById = new Map(recallRows.map((row) => [row.id, row]))

    for (const row of recallRows) {
      if (!row.session_id) continue
      const session = sessionMap.get(row.session_id)
      if (!session) continue
      session.events.push({
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
      })
    }

    const outcomeRows = hasTable('outcome_signals')
      ? (db
          .prepare(
            `SELECT id, session_id, recall_event_id, signal_type, signal_value, occurred_at, source
             FROM outcome_signals
             WHERE session_id IN (${placeholders})
             ORDER BY occurred_at DESC`
          )
          .all(...sessionIds) as OutcomeSignalRow[])
      : []

    for (const row of outcomeRows) {
      if (!row.session_id) continue
      const session = sessionMap.get(row.session_id)
      if (!session) continue
      const linkedRecall = row.recall_event_id ? recallById.get(row.recall_event_id) : undefined
      const detailParts = [linkedRecall?.query, row.source].filter((value): value is string => Boolean(value))
      session.events.push({
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
      })
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
      session.last_activity_at = sessionLastActivity(session, session.events)
      return session
    })
    .sort((a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime())
}
