import type { CommandHistoryEntry, SessionTimelineEntry, SessionTimelineRecord } from '../../lib/types'

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

export function eventColor(event: SessionTimelineEntry): string {
  if (event.kind === 'recall') return 'blue'

  switch (event.signal_type) {
    case 'build_passed':
    case 'error_free_run':
    case 'error_resolved':
    case 'session_success':
    case 'test_passed':
    case 'test_pass':
      return 'green'
    case 'correction':
    case 'session_failure':
    case 'tool_error':
      return 'red'
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
