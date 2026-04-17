export type CanopyAgentStatus = 'idle' | 'assigned' | 'in_progress' | 'blocked' | 'review_required'
export type CanopyAgentHeartbeatSource = 'register' | 'heartbeat' | 'task_sync'
export type CanopyTaskStatus = 'open' | 'assigned' | 'in_progress' | 'blocked' | 'review_required' | 'completed' | 'closed' | 'cancelled'
export type CanopyVerificationState = 'unknown' | 'pending' | 'passed' | 'failed'
export type CanopyAttentionLevel = 'normal' | 'needs_attention' | 'critical'
export type CanopyFreshness = 'fresh' | 'aging' | 'stale' | 'missing'
export type CanopySnapshotPreset =
  | 'default'
  | 'attention'
  | 'review_queue'
  | 'due_soon_review_handoff_follow_through'
  | 'overdue_review_handoff_follow_through'
  | 'due_soon_review_decision_follow_through'
  | 'overdue_review_decision_follow_through'
  | 'review_with_graph_pressure'
  | 'review_handoff_follow_through'
  | 'review_decision_follow_through'
  | 'review_awaiting_support'
  | 'review_ready_for_decision'
  | 'review_ready_for_closeout'
  | 'blocked'
  | 'blocked_by_dependencies'
  | 'handoffs'
  | 'follow_up_chains'
  | 'unclaimed'
  | 'assigned_awaiting_claim'
  | 'claimed_not_started'
  | 'in_progress'
  | 'stalled'
  | 'paused_resumable'
  | 'due_soon'
  | 'due_soon_execution'
  | 'due_soon_review'
  | 'overdue_execution'
  | 'overdue_execution_owned'
  | 'overdue_execution_unclaimed'
  | 'overdue_review'
  | 'awaiting_handoff_acceptance'
  | 'due_soon_handoff_acceptance'
  | 'overdue_handoff_acceptance'
  | 'accepted_handoff_follow_through'
  | 'due_soon_accepted_handoff_follow_through'
  | 'overdue_accepted_handoff_follow_through'
  | 'critical'
  | 'unacknowledged'
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
export type CanopyCouncilParticipantRole = 'reviewer' | 'architect'
export type CanopyCouncilParticipantStatus = 'pending' | 'summoned' | 'accepted' | 'completed' | 'declined'
export type CanopyCouncilSessionState = 'open' | 'closed'
export type CanopyCouncilSessionTimelineKind = 'summon' | 'response' | 'output' | 'decision' | 'closure'
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
  | 'execution_updated'
  | 'triage_updated'
  | 'deadline_updated'
  | 'relationship_updated'
  | 'handoff_created'
  | 'handoff_updated'
  | 'council_session_summoned'
  | 'council_message_posted'
  | 'evidence_attached'
  | 'follow_up_task_created'
export type CanopyExecutionActionKind = 'claim_task' | 'start_task' | 'resume_task' | 'pause_task' | 'yield_task' | 'complete_task'
export type CanopyTaskAttentionReason =
  | 'blocked'
  | 'blocked_by_active_dependency'
  | 'blocked_by_stale_dependency'
  | 'due_soon_execution'
  | 'overdue_execution'
  | 'due_soon_review'
  | 'overdue_review'
  | 'verification_failed'
  | 'review_required'
  | 'review_with_graph_pressure'
  | 'review_handoff_follow_through'
  | 'review_decision_follow_through'
  | 'review_awaiting_support'
  | 'review_ready_for_decision'
  | 'review_ready_for_closeout'
  | 'has_open_follow_ups'
  | 'assigned_awaiting_claim'
  | 'claimed_not_started'
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
  | 'paused_resumable'
  | 'awaiting_handoff_acceptance'
  | 'accepted_handoff_pending_execution'
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
  | 'claim_task'
  | 'start_task'
  | 'resume_task'
  | 'pause_task'
  | 'yield_task'
  | 'complete_task'
  | 'verify_task'
  | 'record_decision'
  | 'close_task'
  | 'reassign_task'
  | 'resolve_dependency'
  | 'reopen_blocked_task_when_unblocked'
  | 'promote_follow_up'
  | 'close_follow_up_chain'
  | 'set_task_priority'
  | 'set_task_severity'
  | 'block_task'
  | 'unblock_task'
  | 'update_task_note'
  | 'set_task_due_at'
  | 'clear_task_due_at'
  | 'set_review_due_at'
  | 'clear_review_due_at'
  | 'create_handoff'
  | 'summon_council_session'
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
export type CanopyDeadlineState = 'none' | 'scheduled' | 'due_soon' | 'overdue'
export type CanopyTaskDeadlineKind = 'execution' | 'review'
export type CanopyBreachSeverity = 'none' | 'low' | 'medium' | 'high' | 'critical'

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

export interface CanopyAgent {
  agent_id: string
  role: string
  status: 'active' | 'idle' | 'offline'
  current_task_id: string | null
  freshness: 'fresh' | 'stale' | 'expired'
  heartbeat_at: string
  model: string | null
  capabilities: string[]
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
  due_at: string | null
  review_due_at: string | null
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
  execution_action: CanopyExecutionActionKind | null
  execution_duration_seconds: number | null
  from_status: CanopyTaskStatus | null
  note: string | null
  owner_agent_id: string | null
  task_id: string
  to_status: CanopyTaskStatus
  verification_state: CanopyVerificationState | null
}

export interface CanopyTaskExecutionSummary {
  active_execution_seconds: number
  claim_count: number
  claimed_at: string | null
  completion_count: number
  last_execution_action: CanopyExecutionActionKind | null
  last_execution_agent_id: string | null
  last_execution_at: string | null
  pause_count: number
  run_count: number
  started_at: string | null
  task_id: string
  total_execution_seconds: number
  yield_count: number
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
  created_at: string | null
  message_id: string
  message_type: CanopyCouncilMessageType
  task_id: string
}

export interface CanopyCouncilSessionParticipant {
  agent_id: string | null
  role: CanopyCouncilParticipantRole
  status?: CanopyCouncilParticipantStatus | null
}

export interface CanopyCouncilSessionTimelineEntry {
  actor_agent_id?: string | null
  body: string
  created_at: string | null
  kind: CanopyCouncilSessionTimelineKind
  title?: string | null
}

export interface CanopyCouncilSession {
  council_session_id: string
  created_at: string
  participants: CanopyCouncilSessionParticipant[]
  session_summary: string | null
  state: CanopyCouncilSessionState
  task_id: string
  timeline: CanopyCouncilSessionTimelineEntry[]
  transcript_ref: string | null
  updated_at: string
  worktree_id: string | null
}

export interface CanopyEvidenceRef {
  evidence_id: string
  label: string
  related_handoff_id: string | null
  related_file: string | null
  related_memory_query: string | null
  related_session_id: string | null
  related_symbol: string | null
  schema_version: '1.0'
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

export interface CanopyTaskDeadlineSummary {
  active_deadline_at: string | null
  active_deadline_kind: CanopyTaskDeadlineKind | null
  active_deadline_state: CanopyDeadlineState
  due_at: string | null
  due_in_seconds: number | null
  execution_state: CanopyDeadlineState
  overdue_by_seconds: number | null
  review_due_at: string | null
  review_state: CanopyDeadlineState
  task_id: string
}

export interface CanopyTaskSlaSummary {
  breach_severity: CanopyBreachSeverity
  due_soon_count: number
  highest_risk_queue: CanopySnapshotPreset | null
  oldest_overdue_seconds: number | null
  overdue_count: number
  task_id: string
}

export interface CanopyTaskRelationshipSummary {
  active_blocker_count: number
  blocker_count: number
  blocking_count: number
  follow_up_child_count: number
  follow_up_parent_count: number
  open_follow_up_child_count: number
  stale_blocker_count: number
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

export interface CanopySnapshotSlaSummary {
  breach_severity: CanopyBreachSeverity
  due_soon_count: number
  oldest_overdue_seconds: number | null
  overdue_count: number
}

export interface CanopySnapshot {
  schema_version?: '1.0'
  agent_attention: CanopyAgentAttention[]
  agent_heartbeat_summaries: CanopyAgentHeartbeatSummary[]
  agents: CanopyAgentRegistration[]
  attention: CanopySnapshotAttentionSummary
  sla_summary: CanopySnapshotSlaSummary
  deadline_summaries: CanopyTaskDeadlineSummary[]
  evidence: CanopyEvidenceRef[]
  execution_summaries: CanopyTaskExecutionSummary[]
  heartbeats: CanopyAgentHeartbeatEvent[]
  handoff_attention: CanopyHandoffAttention[]
  handoffs: CanopyHandoff[]
  operator_actions: CanopyOperatorAction[]
  ownership: CanopyTaskOwnershipSummary[]
  relationships: CanopyTaskRelationship[]
  relationship_summaries: CanopyTaskRelationshipSummary[]
  task_attention: CanopyTaskAttention[]
  task_sla_summaries: CanopyTaskSlaSummary[]
  task_heartbeat_summaries: CanopyTaskHeartbeatSummary[]
  tasks: CanopyTask[]
}

export interface CanopyTaskDetail {
  schema_version?: '1.0'
  allowed_actions: CanopyOperatorAction[]
  agent_attention: CanopyAgentAttention[]
  agent_heartbeat_summaries: CanopyAgentHeartbeatSummary[]
  assignments: CanopyTaskAssignment[]
  attention: CanopyTaskAttention
  deadline_summary: CanopyTaskDeadlineSummary
  evidence: CanopyEvidenceRef[]
  execution_summary: CanopyTaskExecutionSummary
  events: CanopyTaskEvent[]
  heartbeat_summary: CanopyTaskHeartbeatSummary
  heartbeats: CanopyAgentHeartbeatEvent[]
  handoff_attention: CanopyHandoffAttention[]
  handoffs: CanopyHandoff[]
  council_session?: CanopyCouncilSession | null
  messages: CanopyCouncilMessage[]
  operator_actions: CanopyOperatorAction[]
  ownership: CanopyTaskOwnershipSummary
  related_tasks: CanopyRelatedTask[]
  relationships: CanopyTaskRelationship[]
  relationship_summary: CanopyTaskRelationshipSummary
  sla_summary: CanopyTaskSlaSummary
  task: CanopyTask
}

export interface CanopyTaskActionInput {
  action: Extract<
    CanopyOperatorActionKind,
    | 'acknowledge_task'
    | 'unacknowledge_task'
    | 'claim_task'
    | 'start_task'
    | 'resume_task'
    | 'pause_task'
    | 'yield_task'
    | 'complete_task'
    | 'verify_task'
    | 'record_decision'
    | 'close_task'
    | 'reassign_task'
    | 'resolve_dependency'
    | 'reopen_blocked_task_when_unblocked'
    | 'promote_follow_up'
    | 'close_follow_up_chain'
    | 'set_task_priority'
    | 'set_task_severity'
    | 'block_task'
    | 'unblock_task'
    | 'update_task_note'
    | 'set_task_due_at'
    | 'clear_task_due_at'
    | 'set_review_due_at'
    | 'clear_review_due_at'
    | 'create_handoff'
    | 'summon_council_session'
    | 'post_council_message'
    | 'attach_evidence'
    | 'create_follow_up_task'
    | 'link_task_dependency'
  >
  acting_agent_id?: string
  author_agent_id?: string
  assigned_to?: string
  blocked_reason?: string
  changed_by: string
  clear_owner_note?: boolean
  closure_summary?: string
  due_at?: string
  review_due_at?: string
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
  acting_agent_id?: string
  changed_by: string
  note?: string
}
