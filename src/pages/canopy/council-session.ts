import type {
  CanopyCouncilMessage,
  CanopyCouncilParticipantRole,
  CanopyCouncilParticipantStatus,
  CanopyCouncilSession,
  CanopyCouncilSessionParticipant,
  CanopyCouncilSessionTimelineEntry,
  CanopyCouncilSessionTimelineKind,
  CanopyTaskDetail,
} from '../../lib/api'
import { formatLabel } from './canopy-formatters'

export type CouncilSessionSource = 'backend' | 'derived'

export interface CouncilRosterItem {
  agent_id: string | null
  role: CanopyCouncilParticipantRole
  status: CanopyCouncilParticipantStatus
}

export interface CouncilTimelineItem {
  author_agent_id: string | null
  body: string
  created_at: string | null
  kind: CanopyCouncilSessionTimelineKind | 'message'
  title: string
}

export interface CouncilSessionViewModel {
  council_session_id: string | null
  roster: CouncilRosterItem[]
  source: CouncilSessionSource
  state: 'open' | 'closed'
  summary: string | null
  task_id: string
  timeline: CouncilTimelineItem[]
  transcript_ref: string | null
  worktree_id: string | null
}

const ROSTER_ROLES: CanopyCouncilParticipantRole[] = ['reviewer', 'architect']

function normalizeRosterParticipants(
  participants: Array<CanopyCouncilSessionParticipant | { agent_id: string | null; role?: string | null; status?: string | null }>
): CouncilRosterItem[] {
  const byRole = new Map(
    participants
      .filter(
        (participant): participant is CanopyCouncilSessionParticipant => participant.role === 'reviewer' || participant.role === 'architect'
      )
      .map((participant) => [participant.role, participant] as const)
  )

  return ROSTER_ROLES.map((role, index) => {
    const participant = byRole.get(role) ?? participants[index]

    return {
      agent_id: participant?.agent_id ?? null,
      role,
      status: (participant?.status as CouncilRosterItem['status'] | undefined) ?? (participant?.agent_id ? 'summoned' : 'pending'),
    }
  })
}

function normalizeTimeline(entries: CanopyCouncilMessage[], source: CouncilSessionSource): CouncilTimelineItem[] {
  return entries.map((entry) => ({
    author_agent_id: entry.author_agent_id,
    body: entry.body,
    created_at: entry.created_at,
    kind: source === 'backend' ? 'output' : 'message',
    title: formatLabel(entry.message_type),
  }))
}

function normalizeBackendTimeline(entries: CanopyCouncilSessionTimelineEntry[]): CouncilTimelineItem[] {
  return entries.map((entry) => ({
    author_agent_id: entry.actor_agent_id ?? null,
    body: entry.body,
    created_at: entry.created_at,
    kind: entry.kind,
    title: entry.title?.trim() ? entry.title : formatLabel(entry.kind),
  }))
}

function selectCouncilSession(detail: Pick<CanopyTaskDetail, 'council_session'>): CanopyCouncilSession | null {
  return detail.council_session ?? null
}

export function buildCouncilSessionViewModel(
  detail: Pick<CanopyTaskDetail, 'council_session' | 'messages' | 'task'>
): CouncilSessionViewModel | null {
  const session = selectCouncilSession(detail)

  if (session) {
    const timeline =
      session.timeline.length > 0
        ? normalizeBackendTimeline(session.timeline)
        : [
            {
              author_agent_id: null,
              body: 'Task-linked council session was summoned for this task.',
              created_at: session.created_at,
              kind: 'summon' as const,
              title: 'Council session opened',
            },
          ]

    return {
      council_session_id: session.council_session_id,
      roster: normalizeRosterParticipants(session.participants),
      source: 'backend',
      state: session.state,
      summary:
        session.session_summary ??
        (session.transcript_ref
          ? 'Task-linked council session with captured transcript.'
          : 'Task-linked council session attached to this task.'),
      task_id: session.task_id,
      timeline,
      transcript_ref: session.transcript_ref ?? null,
      worktree_id: session.worktree_id ?? null,
    }
  }

  if (detail.messages.length === 0) {
    return null
  }

  const fallbackParticipants = ROSTER_ROLES.map((role) => ({
    agent_id: null,
    role,
    status: 'pending',
  }))

  return {
    council_session_id: null,
    roster: fallbackParticipants as CouncilRosterItem[],
    source: 'derived',
    state: 'open',
    summary: 'Derived from council messages until the backend exposes a task-linked council session record.',
    task_id: detail.task.task_id,
    timeline: normalizeTimeline(detail.messages, 'derived'),
    transcript_ref: null,
    worktree_id: null,
  }
}
