export type CanopyAgentStatus = 'idle' | 'assigned' | 'in_progress' | 'blocked' | 'review_required'
export type CanopyTaskStatus = 'open' | 'assigned' | 'in_progress' | 'blocked' | 'review_required' | 'completed' | 'closed' | 'cancelled'
export type CanopyVerificationState = 'unknown' | 'pending' | 'passed' | 'failed'
export type CanopyHandoffStatus = 'open' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'completed'
export type CanopyHandoffType =
  | 'request_help'
  | 'request_review'
  | 'transfer_ownership'
  | 'request_verification'
  | 'record_decision'
  | 'close_task'
export type CanopyCouncilMessageType = 'proposal' | 'objection' | 'evidence' | 'decision' | 'handoff' | 'status'
export type CanopyEvidenceSourceKind =
  | 'hyphae_session'
  | 'hyphae_recall'
  | 'hyphae_outcome'
  | 'cortina_event'
  | 'mycelium_command'
  | 'mycelium_explain'
  | 'rhizome_impact'
  | 'rhizome_export'
  | 'manual_note'
export type CanopyTaskEventType = 'created' | 'assigned' | 'ownership_transferred' | 'status_changed'

export interface CanopyAgentRegistration {
  agent_id: string
  current_task_id: string | null
  heartbeat_at: string | null
  host_id: string
  host_instance: string
  host_type: string
  model: string
  project_root: string
  status: CanopyAgentStatus
  worktree_id: string
}

export interface CanopyTask {
  blocked_reason: string | null
  closed_at: string | null
  closed_by: string | null
  closure_summary: string | null
  description: string | null
  owner_agent_id: string | null
  project_root: string
  requested_by: string
  status: CanopyTaskStatus
  task_id: string
  title: string
  verification_state: CanopyVerificationState
  verified_at: string | null
  verified_by: string | null
}

export interface CanopyTaskEvent {
  actor: string
  created_at: string
  event_id: string
  event_type: CanopyTaskEventType
  from_status: CanopyTaskStatus | null
  note: string | null
  owner_agent_id: string | null
  task_id: string
  to_status: CanopyTaskStatus
  verification_state: CanopyVerificationState | null
}

export interface CanopyHandoff {
  from_agent_id: string
  handoff_id: string
  handoff_type: CanopyHandoffType
  requested_action: string | null
  status: CanopyHandoffStatus
  summary: string
  task_id: string
  to_agent_id: string
}

export interface CanopyCouncilMessage {
  author_agent_id: string
  body: string
  message_id: string
  message_type: CanopyCouncilMessageType
  task_id: string
}

export interface CanopyEvidenceRef {
  evidence_id: string
  label: string
  related_handoff_id: string | null
  source_kind: CanopyEvidenceSourceKind
  source_ref: string
  summary: string | null
  task_id: string
}

export interface CanopySnapshot {
  agents: CanopyAgentRegistration[]
  evidence: CanopyEvidenceRef[]
  handoffs: CanopyHandoff[]
  tasks: CanopyTask[]
}

export interface CanopyTaskDetail {
  evidence: CanopyEvidenceRef[]
  events: CanopyTaskEvent[]
  handoffs: CanopyHandoff[]
  messages: CanopyCouncilMessage[]
  task: CanopyTask
}
