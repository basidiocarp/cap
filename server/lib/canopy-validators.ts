/**
 * Validators for Canopy task and handoff actions.
 *
 * Each validator accepts raw unknown body and returns either a validated result
 * or an error descriptor. Centralizes all validation logic in one place and makes
 * it easy to test each action type in isolation.
 */

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string }

// Allowed enum values extracted from the route file
export const ALLOWED_SORTS = new Set(['status', 'title', 'updated_at', 'created_at', 'verification', 'priority', 'severity', 'attention'])
export const ALLOWED_VIEWS = new Set([
  'all',
  'active',
  'blocked',
  'blocked_by_dependencies',
  'review',
  'due_soon_review_handoff_follow_through',
  'overdue_review_handoff_follow_through',
  'due_soon_review_decision_follow_through',
  'overdue_review_decision_follow_through',
  'review_with_graph_pressure',
  'review_handoff_follow_through',
  'review_decision_follow_through',
  'review_awaiting_support',
  'review_ready_for_decision',
  'review_ready_for_closeout',
  'handoffs',
  'follow_up_chains',
  'unclaimed',
  'assigned_awaiting_claim',
  'claimed_not_started',
  'in_progress',
  'stalled',
  'paused_resumable',
  'due_soon',
  'due_soon_execution',
  'due_soon_review',
  'overdue_execution',
  'overdue_execution_owned',
  'overdue_execution_unclaimed',
  'overdue_review',
  'awaiting_handoff_acceptance',
  'due_soon_handoff_acceptance',
  'overdue_handoff_acceptance',
  'accepted_handoff_follow_through',
  'due_soon_accepted_handoff_follow_through',
  'overdue_accepted_handoff_follow_through',
  'attention',
])
export const ALLOWED_PRESETS = new Set([
  'default',
  'attention',
  'review_queue',
  'due_soon_review_handoff_follow_through',
  'overdue_review_handoff_follow_through',
  'due_soon_review_decision_follow_through',
  'overdue_review_decision_follow_through',
  'review_with_graph_pressure',
  'review_handoff_follow_through',
  'review_decision_follow_through',
  'review_awaiting_support',
  'review_ready_for_decision',
  'review_ready_for_closeout',
  'blocked',
  'blocked_by_dependencies',
  'handoffs',
  'follow_up_chains',
  'unclaimed',
  'assigned_awaiting_claim',
  'claimed_not_started',
  'in_progress',
  'stalled',
  'paused_resumable',
  'due_soon',
  'due_soon_execution',
  'due_soon_review',
  'overdue_execution',
  'overdue_execution_owned',
  'overdue_execution_unclaimed',
  'overdue_review',
  'awaiting_handoff_acceptance',
  'due_soon_handoff_acceptance',
  'overdue_handoff_acceptance',
  'accepted_handoff_follow_through',
  'due_soon_accepted_handoff_follow_through',
  'overdue_accepted_handoff_follow_through',
  'critical',
  'unacknowledged',
])
export const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])
export const ALLOWED_SEVERITIES = new Set(['none', 'low', 'medium', 'high', 'critical'])
export const ALLOWED_ATTENTION_LEVELS = new Set(['normal', 'needs_attention', 'critical'])
export const ALLOWED_ACKNOWLEDGED = new Set(['true', 'false'])
export const ALLOWED_VERIFICATION_STATES = new Set(['pending', 'passed', 'failed'])
export const ALLOWED_TASK_ACTIONS = new Set([
  'acknowledge_task',
  'unacknowledge_task',
  'claim_task',
  'start_task',
  'resume_task',
  'pause_task',
  'yield_task',
  'complete_task',
  'verify_task',
  'record_decision',
  'close_task',
  'reassign_task',
  'resolve_dependency',
  'reopen_blocked_task_when_unblocked',
  'promote_follow_up',
  'close_follow_up_chain',
  'set_task_priority',
  'set_task_severity',
  'block_task',
  'unblock_task',
  'update_task_note',
  'set_task_due_at',
  'clear_task_due_at',
  'set_review_due_at',
  'clear_review_due_at',
  'create_handoff',
  'summon_council_session',
  'post_council_message',
  'attach_evidence',
  'create_follow_up_task',
  'link_task_dependency',
])
export const ALLOWED_TASK_RELATIONSHIP_ROLES = new Set(['blocks', 'blocked_by'])
export const ALLOWED_HANDOFF_ACTIONS = new Set([
  'accept_handoff',
  'reject_handoff',
  'cancel_handoff',
  'complete_handoff',
  'follow_up_handoff',
  'expire_handoff',
])
export const ALLOWED_HANDOFF_TYPES = new Set([
  'request_help',
  'request_review',
  'transfer_ownership',
  'request_verification',
  'record_decision',
  'close_task',
])
export const ALLOWED_COUNCIL_MESSAGE_TYPES = new Set(['proposal', 'objection', 'evidence', 'decision', 'handoff', 'status'])
export const ALLOWED_EVIDENCE_SOURCE_KINDS = new Set([
  'hyphae_session',
  'hyphae_recall',
  'hyphae_outcome',
  'cortina_event',
  'mycelium_command',
  'mycelium_explain',
  'rhizome_impact',
  'rhizome_export',
  'manual_note',
])

/**
 * Task action body from POST /tasks/:taskId/actions
 */
export interface TaskActionBody {
  action?: string
  acting_agent_id?: string
  author_agent_id?: string
  assigned_to?: string
  blocked_reason?: string
  changed_by?: string
  clear_owner_note?: boolean
  closure_summary?: string
  due_at?: string
  review_due_at?: string
  evidence_label?: string
  evidence_source_kind?: string
  evidence_source_ref?: string
  evidence_summary?: string
  expires_at?: string
  follow_up_description?: string
  follow_up_title?: string
  from_agent_id?: string
  handoff_summary?: string
  handoff_type?: string
  message_body?: string
  message_type?: string
  note?: string
  owner_note?: string
  priority?: string
  related_task_id?: string
  related_file?: string
  related_handoff_id?: string
  related_memory_query?: string
  related_session_id?: string
  related_symbol?: string
  relationship_role?: string
  requested_action?: string
  severity?: string
  to_agent_id?: string
  verification_state?: string
}

/**
 * Handoff action body from POST /handoffs/:handoffId/actions
 */
export interface HandoffActionBody {
  action?: string
  acting_agent_id?: string
  changed_by?: string
  note?: string
}

/**
 * Validated task action parameters ready for use by canopy.applyTaskAction
 */
export interface ValidatedTaskAction {
  actingAgentId?: string
  action: string
  assignedTo?: string
  authorAgentId?: string
  blockedReason?: string
  changedBy: string
  clearOwnerNote?: boolean
  closureSummary?: string
  dueAt?: string
  evidenceLabel?: string
  evidenceSourceKind?: string
  evidenceSourceRef?: string
  evidenceSummary?: string
  expiresAt?: string
  followUpDescription?: string
  followUpTitle?: string
  fromAgentId?: string
  handoffSummary?: string
  handoffType?: string
  messageBody?: string
  messageType?: string
  note?: string
  ownerNote?: string
  priority?: string
  relatedFile?: string
  relatedHandoffId?: string
  relatedMemoryQuery?: string
  relatedSessionId?: string
  relatedSymbol?: string
  relatedTaskId?: string
  relationshipRole?: string
  requestedAction?: string
  reviewDueAt?: string
  severity?: string
  toAgentId?: string
  verificationState?: string
}

/**
 * Validated handoff action parameters ready for use by canopy.applyHandoffAction
 */
export interface ValidatedHandoffAction {
  actingAgentId?: string
  action: string
  changedBy: string
  note?: string
}

/**
 * Validate a task action request body.
 *
 * Checks:
 * - action and changed_by are required
 * - action is in ALLOWED_TASK_ACTIONS
 * - action-specific field requirements (e.g., claim_task requires acting_agent_id)
 * - enum values for verification_state, handoff_type, etc. are valid
 */
export function validateTaskAction(body: unknown): ValidationResult<ValidatedTaskAction> {
  const b = body as TaskActionBody

  // Required fields
  if (!b.action || !b.changed_by) {
    return { error: 'Canopy task action requires action and changed_by', ok: false }
  }

  if (!ALLOWED_TASK_ACTIONS.has(b.action)) {
    return { error: `Unsupported Canopy task action: ${b.action}`, ok: false }
  }

  // Action-specific validation
  const executionActions = ['claim_task', 'start_task', 'resume_task', 'pause_task', 'yield_task', 'complete_task'] as const
  if ((executionActions as readonly string[]).includes(b.action) && !b.acting_agent_id?.trim()) {
    return { error: `${b.action} requires an acting_agent_id`, ok: false }
  }

  if (b.action === 'verify_task') {
    if (!b.verification_state || !ALLOWED_VERIFICATION_STATES.has(b.verification_state)) {
      return { error: 'verify_task requires a valid verification_state', ok: false }
    }
    if (b.verification_state === 'passed') {
      return { error: 'verify_task no longer accepts passed; use close_task', ok: false }
    }
  }

  if (b.action === 'record_decision') {
    if (!b.author_agent_id?.trim()) {
      return { error: 'record_decision requires an author_agent_id', ok: false }
    }
    if (!b.message_body?.trim()) {
      return { error: 'record_decision requires a message_body', ok: false }
    }
  }

  if (b.action === 'close_task' && !b.closure_summary?.trim()) {
    return { error: 'close_task requires a closure_summary', ok: false }
  }

  if (b.action === 'set_task_due_at' && !b.due_at?.trim()) {
    return { error: 'set_task_due_at requires a due_at', ok: false }
  }

  if (b.action === 'set_review_due_at' && !b.review_due_at?.trim()) {
    return { error: 'set_review_due_at requires a review_due_at', ok: false }
  }

  if (b.action === 'create_handoff') {
    if (!b.from_agent_id?.trim() || !b.to_agent_id?.trim()) {
      return { error: 'create_handoff requires from_agent_id and to_agent_id', ok: false }
    }
    if (!b.handoff_type || !ALLOWED_HANDOFF_TYPES.has(b.handoff_type)) {
      return { error: 'create_handoff requires a valid handoff_type', ok: false }
    }
    if (!b.handoff_summary?.trim()) {
      return { error: 'create_handoff requires a handoff_summary', ok: false }
    }
  }

  if (b.action === 'post_council_message') {
    if (!b.author_agent_id?.trim()) {
      return { error: 'post_council_message requires an author_agent_id', ok: false }
    }
    if (!b.message_type || !ALLOWED_COUNCIL_MESSAGE_TYPES.has(b.message_type)) {
      return { error: 'post_council_message requires a valid message_type', ok: false }
    }
    if (!b.message_body?.trim()) {
      return { error: 'post_council_message requires a message_body', ok: false }
    }
  }

  if (b.action === 'attach_evidence') {
    if (!b.evidence_source_kind || !ALLOWED_EVIDENCE_SOURCE_KINDS.has(b.evidence_source_kind)) {
      return { error: 'attach_evidence requires a valid evidence_source_kind', ok: false }
    }
    if (!b.evidence_source_ref?.trim() || !b.evidence_label?.trim()) {
      return { error: 'attach_evidence requires evidence_source_ref and evidence_label', ok: false }
    }
  }

  if (b.action === 'create_follow_up_task' && !b.follow_up_title?.trim()) {
    return { error: 'create_follow_up_task requires a follow_up_title', ok: false }
  }

  if (b.action === 'link_task_dependency') {
    if (!b.related_task_id?.trim()) {
      return { error: 'link_task_dependency requires a related_task_id', ok: false }
    }
    if (!b.relationship_role || !ALLOWED_TASK_RELATIONSHIP_ROLES.has(b.relationship_role)) {
      return { error: 'link_task_dependency requires a valid relationship_role', ok: false }
    }
  }

  if ((b.action === 'resolve_dependency' || b.action === 'promote_follow_up') && !b.related_task_id?.trim()) {
    return { error: `${b.action} requires a related_task_id`, ok: false }
  }

  // All validations passed; return validated and canonicalized action
  return {
    data: {
      actingAgentId: b.acting_agent_id,
      action: b.action,
      assignedTo: b.assigned_to,
      authorAgentId: b.author_agent_id,
      blockedReason: b.blocked_reason,
      changedBy: b.changed_by,
      clearOwnerNote: b.clear_owner_note,
      closureSummary: b.closure_summary,
      dueAt: b.due_at,
      evidenceLabel: b.evidence_label,
      evidenceSourceKind:
        b.evidence_source_kind && ALLOWED_EVIDENCE_SOURCE_KINDS.has(b.evidence_source_kind) ? b.evidence_source_kind : undefined,
      evidenceSourceRef: b.evidence_source_ref,
      evidenceSummary: b.evidence_summary,
      expiresAt: b.expires_at,
      followUpDescription: b.follow_up_description,
      followUpTitle: b.follow_up_title,
      fromAgentId: b.from_agent_id,
      handoffSummary: b.handoff_summary,
      handoffType: b.handoff_type && ALLOWED_HANDOFF_TYPES.has(b.handoff_type) ? b.handoff_type : undefined,
      messageBody: b.message_body,
      messageType: b.message_type && ALLOWED_COUNCIL_MESSAGE_TYPES.has(b.message_type) ? b.message_type : undefined,
      note: b.note,
      ownerNote: b.owner_note,
      priority: b.priority,
      relatedFile: b.related_file,
      relatedHandoffId: b.related_handoff_id,
      relatedMemoryQuery: b.related_memory_query,
      relatedSessionId: b.related_session_id,
      relatedSymbol: b.related_symbol,
      relatedTaskId: b.related_task_id,
      relationshipRole: b.relationship_role && ALLOWED_TASK_RELATIONSHIP_ROLES.has(b.relationship_role) ? b.relationship_role : undefined,
      requestedAction: b.requested_action,
      reviewDueAt: b.review_due_at,
      severity: b.severity,
      toAgentId: b.to_agent_id,
      verificationState: b.verification_state && ALLOWED_VERIFICATION_STATES.has(b.verification_state) ? b.verification_state : undefined,
    },
    ok: true,
  }
}

/**
 * Validate a handoff action request body.
 *
 * Checks:
 * - action and changed_by are required
 * - action is in ALLOWED_HANDOFF_ACTIONS
 * - action-specific field requirements (e.g., accept_handoff requires acting_agent_id)
 */
export function validateHandoffAction(body: unknown): ValidationResult<ValidatedHandoffAction> {
  const b = body as HandoffActionBody

  // Required fields
  if (!b.action || !b.changed_by) {
    return { error: 'Canopy handoff action requires action and changed_by', ok: false }
  }

  if (!ALLOWED_HANDOFF_ACTIONS.has(b.action)) {
    return { error: `Unsupported Canopy handoff action: ${b.action}`, ok: false }
  }

  // Action-specific validation
  if ((b.action === 'accept_handoff' || b.action === 'reject_handoff') && !b.acting_agent_id?.trim()) {
    return { error: `${b.action} requires an acting_agent_id`, ok: false }
  }

  // All validations passed
  return {
    data: {
      actingAgentId: b.acting_agent_id,
      action: b.action,
      changedBy: b.changed_by,
      note: b.note,
    },
    ok: true,
  }
}
