export type CanopyAgentStatus = 'idle' | 'assigned' | 'in_progress' | 'blocked' | 'review_required'
export type CanopyAgentHeartbeatSource = 'register' | 'heartbeat' | 'task_sync'
export type CanopyTaskStatus = 'open' | 'assigned' | 'in_progress' | 'blocked' | 'review_required' | 'completed' | 'closed' | 'cancelled'
export type CanopyVerificationState = 'unknown' | 'pending' | 'passed' | 'failed'
export type CanopyAttentionLevel = 'normal' | 'needs_attention' | 'critical'
export type CanopyFreshness = 'fresh' | 'aging' | 'stale' | 'missing'
export type CanopySnapshotPreset = 'default' | 'attention' | 'review_queue' | 'blocked' | 'handoffs' | 'critical' | 'unacknowledged'
export type CanopyTaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type CanopyTaskSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical'
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
export type CanopyTaskEventType = 'created' | 'assigned' | 'ownership_transferred' | 'status_changed' | 'triage_updated'
export type CanopyTaskAttentionReason =
  | 'blocked'
  | 'verification_failed'
  | 'review_required'
  | 'unacknowledged'
  | 'high_priority'
  | 'critical_priority'
  | 'high_severity'
  | 'critical_severity'
  | 'aging_update'
  | 'stale_update'
  | 'aging_owner_heartbeat'
  | 'stale_owner_heartbeat'
  | 'missing_owner_heartbeat'
  | 'aging_open_handoff'
  | 'stale_open_handoff'
export type CanopyHandoffAttentionReason = 'aging_open_handoff' | 'stale_open_handoff'
export type CanopyAgentAttentionReason =
  | 'aging_heartbeat'
  | 'stale_heartbeat'
  | 'missing_heartbeat'
  | 'blocked_status'
  | 'review_required_status'

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

export interface CanopyAgentHeartbeatEvent {
  agent_id: string
  created_at: string
  current_task_id: string | null
  heartbeat_id: string
  related_task_id: string | null
  source: CanopyAgentHeartbeatSource
  status: CanopyAgentStatus
}

export interface CanopyAgentAttention {
  agent_id: string
  current_task_id: string | null
  freshness: CanopyFreshness
  last_heartbeat_at: string | null
  level: CanopyAttentionLevel
  reasons: CanopyAgentAttentionReason[]
}

export interface CanopyTask {
  acknowledged_at: string | null
  acknowledged_by: string | null
  blocked_reason: string | null
  closed_at: string | null
  closed_by: string | null
  closure_summary: string | null
  created_at: string
  description: string | null
  owner_agent_id: string | null
  owner_note: string | null
  priority: CanopyTaskPriority
  project_root: string
  requested_by: string
  severity: CanopyTaskSeverity
  status: CanopyTaskStatus
  task_id: string
  title: string
  updated_at: string
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
  created_at: string
  due_at: string | null
  expires_at: string | null
  from_agent_id: string
  handoff_id: string
  handoff_type: CanopyHandoffType
  requested_action: string | null
  resolved_at: string | null
  status: CanopyHandoffStatus
  summary: string
  task_id: string
  to_agent_id: string
  updated_at: string
}

export interface CanopyHandoffAttention {
  freshness: CanopyFreshness
  handoff_id: string
  level: CanopyAttentionLevel
  reasons: CanopyHandoffAttentionReason[]
  task_id: string
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
  related_file: string | null
  related_memory_query: string | null
  related_session_id: string | null
  related_symbol: string | null
  source_kind: CanopyEvidenceSourceKind
  source_ref: string
  summary: string | null
  task_id: string
}

export interface CanopyTaskAttention {
  acknowledged: boolean
  freshness: CanopyFreshness
  level: CanopyAttentionLevel
  open_handoff_freshness: CanopyFreshness | null
  owner_heartbeat_freshness: CanopyFreshness | null
  reasons: CanopyTaskAttentionReason[]
  task_id: string
}

export interface CanopySnapshotAttentionSummary {
  agents_needing_attention: number
  critical_tasks: number
  handoffs_needing_attention: number
  stale_agents: number
  stale_handoffs: number
  tasks_needing_attention: number
}

export interface CanopySnapshot {
  agent_attention: CanopyAgentAttention[]
  agents: CanopyAgentRegistration[]
  attention: CanopySnapshotAttentionSummary
  evidence: CanopyEvidenceRef[]
  heartbeats: CanopyAgentHeartbeatEvent[]
  handoff_attention: CanopyHandoffAttention[]
  handoffs: CanopyHandoff[]
  task_attention: CanopyTaskAttention[]
  tasks: CanopyTask[]
}

export interface CanopyTaskDetail {
  agent_attention: CanopyAgentAttention[]
  attention: CanopyTaskAttention
  evidence: CanopyEvidenceRef[]
  events: CanopyTaskEvent[]
  heartbeats: CanopyAgentHeartbeatEvent[]
  handoff_attention: CanopyHandoffAttention[]
  handoffs: CanopyHandoff[]
  messages: CanopyCouncilMessage[]
  task: CanopyTask
}
