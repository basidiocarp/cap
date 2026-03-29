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
export type CanopyTaskEventType =
  | 'created'
  | 'assigned'
  | 'ownership_transferred'
  | 'status_changed'
  | 'triage_updated'
  | 'relationship_updated'
  | 'handoff_created'
  | 'handoff_updated'
  | 'council_message_posted'
  | 'evidence_attached'
  | 'follow_up_task_created'
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
export type CanopyOperatorActionKind =
  | 'acknowledge_task'
  | 'unacknowledge_task'
  | 'verify_task'
  | 'reassign_task'
  | 'set_task_priority'
  | 'set_task_severity'
  | 'block_task'
  | 'unblock_task'
  | 'update_task_note'
  | 'create_handoff'
  | 'post_council_message'
  | 'attach_evidence'
  | 'create_follow_up_task'
  | 'link_task_dependency'
  | 'accept_handoff'
  | 'reject_handoff'
  | 'cancel_handoff'
  | 'complete_handoff'
  | 'follow_up_handoff'
  | 'expire_handoff'
export type CanopyOperatorActionTargetKind = 'task' | 'handoff'
export type CanopyTaskRelationshipKind = 'follow_up' | 'blocks'
export type CanopyTaskRelationshipRole = 'follow_up_parent' | 'follow_up_child' | 'blocks' | 'blocked_by'

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

export interface CanopyTaskRelationship {
  created_at: string
  created_by: string
  kind: CanopyTaskRelationshipKind
  relationship_id: string
  source_task_id: string
  target_task_id: string
  updated_at: string
}

export interface CanopyRelatedTask {
  blocked_reason: string | null
  created_at: string
  owner_agent_id: string | null
  priority: CanopyTaskPriority
  related_task_id: string
  relationship_id: string
  relationship_kind: CanopyTaskRelationshipKind
  relationship_role: CanopyTaskRelationshipRole
  severity: CanopyTaskSeverity
  status: CanopyTaskStatus
  title: string
  updated_at: string
  verification_state: CanopyVerificationState
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

export interface CanopyTaskAssignment {
  assigned_at: string
  assigned_by: string
  assigned_to: string
  assignment_id: string
  reason: string | null
  task_id: string
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

export interface CanopyTaskOwnershipSummary {
  assignment_count: number
  current_owner_agent_id: string | null
  last_assigned_at: string | null
  last_assigned_by: string | null
  last_assigned_to: string | null
  last_assignment_reason: string | null
  reassignment_count: number
  task_id: string
}

export interface CanopyTaskHeartbeatSummary {
  aging_agents: number
  fresh_agents: number
  heartbeat_count: number
  last_heartbeat_at: string | null
  missing_agents: number
  related_agent_count: number
  stale_agents: number
  task_id: string
}

export interface CanopyAgentHeartbeatSummary {
  agent_id: string
  current_task_id: string | null
  freshness: CanopyFreshness
  heartbeat_count: number
  last_heartbeat_at: string | null
  last_status: CanopyAgentStatus | null
}

export interface CanopyOperatorAction {
  action_id: string
  agent_id: string | null
  due_at: string | null
  expires_at: string | null
  handoff_id: string | null
  kind: CanopyOperatorActionKind
  level: CanopyAttentionLevel
  summary: string
  target_kind: CanopyOperatorActionTargetKind
  task_id: string | null
  title: string
}

export interface CanopySnapshotAttentionSummary {
  actionable_handoffs: number
  actionable_tasks: number
  agents_needing_attention: number
  critical_tasks: number
  handoffs_needing_attention: number
  stale_agents: number
  stale_handoffs: number
  tasks_needing_attention: number
}

export interface CanopySnapshot {
  agent_attention: CanopyAgentAttention[]
  agent_heartbeat_summaries: CanopyAgentHeartbeatSummary[]
  agents: CanopyAgentRegistration[]
  attention: CanopySnapshotAttentionSummary
  evidence: CanopyEvidenceRef[]
  heartbeats: CanopyAgentHeartbeatEvent[]
  handoff_attention: CanopyHandoffAttention[]
  handoffs: CanopyHandoff[]
  operator_actions: CanopyOperatorAction[]
  ownership: CanopyTaskOwnershipSummary[]
  relationships: CanopyTaskRelationship[]
  task_attention: CanopyTaskAttention[]
  task_heartbeat_summaries: CanopyTaskHeartbeatSummary[]
  tasks: CanopyTask[]
}

export interface CanopyTaskDetail {
  allowed_actions: CanopyOperatorAction[]
  agent_attention: CanopyAgentAttention[]
  agent_heartbeat_summaries: CanopyAgentHeartbeatSummary[]
  assignments: CanopyTaskAssignment[]
  attention: CanopyTaskAttention
  evidence: CanopyEvidenceRef[]
  events: CanopyTaskEvent[]
  heartbeat_summary: CanopyTaskHeartbeatSummary
  heartbeats: CanopyAgentHeartbeatEvent[]
  handoff_attention: CanopyHandoffAttention[]
  handoffs: CanopyHandoff[]
  messages: CanopyCouncilMessage[]
  operator_actions: CanopyOperatorAction[]
  ownership: CanopyTaskOwnershipSummary
  related_tasks: CanopyRelatedTask[]
  relationships: CanopyTaskRelationship[]
  task: CanopyTask
}

export interface CanopyTaskActionInput {
  action: Extract<
    CanopyOperatorActionKind,
    | 'acknowledge_task'
    | 'unacknowledge_task'
    | 'verify_task'
    | 'reassign_task'
    | 'set_task_priority'
    | 'set_task_severity'
    | 'block_task'
    | 'unblock_task'
    | 'update_task_note'
    | 'create_handoff'
    | 'post_council_message'
    | 'attach_evidence'
    | 'create_follow_up_task'
    | 'link_task_dependency'
  >
  author_agent_id?: string
  assigned_to?: string
  blocked_reason?: string
  changed_by: string
  clear_owner_note?: boolean
  closure_summary?: string
  due_at?: string
  evidence_label?: string
  evidence_source_kind?: CanopyEvidenceSourceKind
  evidence_source_ref?: string
  evidence_summary?: string
  expires_at?: string
  follow_up_description?: string
  follow_up_title?: string
  from_agent_id?: string
  handoff_summary?: string
  handoff_type?: CanopyHandoffType
  message_body?: string
  message_type?: CanopyCouncilMessageType
  note?: string
  owner_note?: string
  priority?: CanopyTaskPriority
  related_task_id?: string
  related_file?: string
  related_handoff_id?: string
  related_memory_query?: string
  related_session_id?: string
  related_symbol?: string
  relationship_role?: Extract<CanopyTaskRelationshipRole, 'blocks' | 'blocked_by'>
  requested_action?: string
  severity?: CanopyTaskSeverity
  to_agent_id?: string
  verification_state?: Exclude<CanopyVerificationState, 'unknown'>
}

export interface CanopyHandoffActionInput {
  action: Extract<
    CanopyOperatorActionKind,
    'accept_handoff' | 'reject_handoff' | 'cancel_handoff' | 'complete_handoff' | 'follow_up_handoff' | 'expire_handoff'
  >
  changed_by: string
  note?: string
}
