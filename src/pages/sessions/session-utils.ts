import type { CommandHistoryEntry, SessionTimelineEntry, SessionTimelineEventType, SessionTimelineRecord } from '../../lib/types'

export function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'mycelium'
    case 'in-progress':
    case 'active':
      return 'yellow'
    case 'failed':
    case 'error':
      return 'red'
    default:
      return 'gray'
  }
}

export function formatDuration(startStr: string, endStr?: string | null): string {
  if (!endStr) return 'In progress'
  const start = new Date(startStr).getTime()
  const end = new Date(endStr).getTime()
  const diffMs = Math.max(0, end - start)
  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

export function parseJsonCount(raw: string | null | undefined): number {
  if (!raw) return 0

  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) return parsed.length
    if (typeof parsed === 'number' && Number.isFinite(parsed)) return parsed
    if (typeof parsed === 'string') {
      const value = Number(parsed)
      return Number.isFinite(value) ? value : 0
    }
  } catch {
    const value = Number(raw)
    if (Number.isFinite(value)) return value
  }

  return 0
}

export function parseJsonStrings(raw: string | null | undefined): string[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return typeof parsed === 'string' ? [parsed] : []
    }

    return parsed
      .map((item) => {
        if (typeof item === 'string') return item
        if (typeof item === 'number' || typeof item === 'boolean') return String(item)
        return JSON.stringify(item)
      })
      .filter((item): item is string => Boolean(item))
  } catch {
    return []
  }
}

type SessionTimelineRenderableEntry = SessionTimelineEntry & {
  content?: string | null
  score?: number | null
  timestamp?: string | null
  type?: SessionTimelineEventType | null
}

export function getTimelineEventTimestamp(event: SessionTimelineRenderableEntry): string {
  return event.timestamp ?? event.occurred_at
}

export function getTimelineEventType(event: SessionTimelineRenderableEntry): SessionTimelineEventType {
  if (event.type && event.type !== 'outcome') {
    return event.type
  }

  if (event.kind === 'recall') return 'recall'

  switch (event.signal_type) {
    case 'correction':
      return 'correction'
    case 'export':
    case 'session_export':
      return 'export'
    case 'build_failed':
    case 'session_failure':
    case 'test_failed':
    case 'test_failure':
    case 'tool_error':
      return 'error'
    case 'build_passed':
    case 'error_free_run':
    case 'error_resolved':
    case 'session_success':
    case 'test_passed':
    case 'test_pass':
      return 'test_pass'
    case 'summary':
    case 'session_summary':
      return 'summary'
    default:
      return 'summary'
  }
}

export function timelineEventLabel(eventType: SessionTimelineEventType): string {
  switch (eventType) {
    case 'correction':
      return 'Correction'
    case 'error':
      return 'Error'
    case 'export':
      return 'Export'
    case 'outcome':
      return 'Outcome'
    case 'recall':
      return 'Recall'
    case 'summary':
      return 'Summary'
    case 'test_fail':
      return 'Test failed'
    case 'test_pass':
      return 'Test passed'
    default:
      return 'Summary'
  }
}

export function sortTimelineEvents<T extends SessionTimelineRenderableEntry>(events: T[], direction: 'asc' | 'desc' = 'asc'): T[] {
  const sorted = [...events].sort((left, right) => {
    const leftTime = new Date(getTimelineEventTimestamp(left)).getTime()
    const rightTime = new Date(getTimelineEventTimestamp(right)).getTime()

    if (leftTime !== rightTime) {
      return leftTime - rightTime
    }

    return left.id.localeCompare(right.id)
  })

  return direction === 'asc' ? sorted : sorted.reverse()
}

export function eventColor(event: SessionTimelineRenderableEntry): string {
  switch (getTimelineEventType(event)) {
    case 'recall':
      return 'blue'
    case 'error':
    case 'test_fail':
      return 'red'
    case 'correction':
      return 'yellow'
    case 'export':
      return 'cyan'
    case 'test_pass':
      return 'green'
    default:
      return 'gray'
  }
}

function commandWindowEnd(session: SessionTimelineRecord): number {
  return new Date(session.ended_at ?? session.last_activity_at).getTime()
}

export function commandsForSession(session: SessionTimelineRecord, commands: CommandHistoryEntry[]): CommandHistoryEntry[] {
  if (session.runtime_session_id) {
    const exactMatches = commands.filter((command) => command.session_id === session.runtime_session_id)
    if (exactMatches.length > 0) {
      return exactMatches
    }
  }

  const start = new Date(session.started_at).getTime()
  const end = commandWindowEnd(session)
  return commands.filter((command) => {
    const timestamp = new Date(command.timestamp).getTime()
    return timestamp >= start && timestamp <= end
  })
}
