import type {
  CanopyAgentHeartbeatEvent,
  CanopyAttentionLevel,
  CanopyFreshness,
  CanopyOperatorAction,
  CanopyTask,
  CanopyTaskDetail,
  CanopyTaskEvent,
  CanopyTaskPriority,
  CanopyTaskSeverity,
  CanopyTaskStatus,
} from '../../lib/api'
import { codeExplorerHref, memoriesHref, sessionsHref } from '../../lib/routes'

export interface EvidenceLink {
  label: string
  to: string
}

export function freshnessColor(freshness: CanopyFreshness | null | undefined): string {
  switch (freshness) {
    case 'fresh':
      return 'green'
    case 'aging':
      return 'yellow'
    case 'stale':
      return 'red'
    case 'missing':
      return 'gray'
    default:
      return 'gray'
  }
}

export function attentionColor(level: CanopyAttentionLevel): string {
  switch (level) {
    case 'critical':
      return 'red'
    case 'needs_attention':
      return 'yellow'
    default:
      return 'green'
  }
}

export function formatLabel(value: string): string {
  return value.replaceAll('_', ' ')
}

export function joinedReasons(reasons: string[]): string {
  return reasons.map(formatLabel).join(', ')
}

export function operatorActionLabel(kind: CanopyOperatorAction['kind']): string {
  return kind.replaceAll('_', ' ')
}

export function priorityColor(priority: CanopyTaskPriority): string {
  switch (priority) {
    case 'critical':
      return 'red'
    case 'high':
      return 'orange'
    case 'medium':
      return 'yellow'
    default:
      return 'gray'
  }
}

export function severityColor(severity: CanopyTaskSeverity): string {
  switch (severity) {
    case 'critical':
      return 'red'
    case 'high':
      return 'orange'
    case 'medium':
      return 'yellow'
    case 'low':
      return 'blue'
    default:
      return 'gray'
  }
}

export function heartbeatSourceLabel(source: CanopyAgentHeartbeatEvent['source']): string {
  if (source === 'task_sync') return 'task sync'
  return source
}

export function evidenceLinks(item: CanopyTaskDetail['evidence'][number]): EvidenceLink[] {
  const links: EvidenceLink[] = []

  if (item.related_session_id) {
    links.push({ label: 'Open session', to: sessionsHref({ session: item.related_session_id }) })
  } else if (item.source_kind === 'hyphae_session') {
    links.push({ label: 'Open session', to: sessionsHref({ session: item.source_ref }) })
  }

  if (item.related_memory_query) {
    links.push({ label: 'Search memories', to: memoriesHref({ q: item.related_memory_query }) })
  } else if (item.source_kind === 'hyphae_session') {
    links.push({ label: 'Search session memories', to: memoriesHref({ q: item.source_ref }) })
  } else if (['hyphae_recall', 'hyphae_outcome', 'cortina_event', 'manual_note'].includes(item.source_kind)) {
    links.push({ label: 'Search memories', to: memoriesHref({ q: item.source_ref }) })
  }

  if (item.related_file || item.related_symbol) {
    links.push({
      label: 'Open code explorer',
      to: codeExplorerHref({
        file: item.related_file ?? undefined,
        symbol: item.related_symbol ?? undefined,
      }),
    })
  } else if (item.source_kind === 'rhizome_impact' || item.source_kind === 'rhizome_export') {
    links.push({ label: 'Open code explorer', to: codeExplorerHref({ filter: item.source_ref }) })
  }

  if (links.length === 0 && (item.source_kind === 'mycelium_command' || item.source_kind === 'mycelium_explain')) {
    links.push({ label: 'Open sessions', to: sessionsHref() })
  }

  return links
}

export function statusColor(status: CanopyTaskStatus): string {
  switch (status) {
    case 'completed':
    case 'closed':
      return 'green'
    case 'review_required':
      return 'yellow'
    case 'blocked':
      return 'red'
    case 'in_progress':
    case 'assigned':
      return 'blue'
    case 'cancelled':
      return 'gray'
    default:
      return 'grape'
  }
}

export function verificationColor(state: string): string {
  switch (state) {
    case 'passed':
      return 'green'
    case 'failed':
      return 'red'
    case 'pending':
      return 'yellow'
    default:
      return 'gray'
  }
}

export function attentionSummaryLabel(level: CanopyAttentionLevel): string {
  if (level === 'needs_attention') return 'needs attention'
  return level
}

export function eventTitle(event: CanopyTaskEvent): string {
  switch (event.event_type) {
    case 'created':
      return 'Task created'
    case 'assigned':
      return 'Task assigned'
    case 'ownership_transferred':
      return 'Ownership transferred'
    case 'status_changed':
      return `Status changed to ${event.to_status}`
    case 'triage_updated':
      return 'Triage updated'
    case 'handoff_updated':
      return 'Handoff updated'
    default:
      return event.event_type
  }
}

export function matchesActiveTask(status: CanopyTask['status']): boolean {
  return !['completed', 'closed', 'cancelled'].includes(status)
}
