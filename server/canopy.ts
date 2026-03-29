import { createCliRunner } from './lib/cli.ts'
import { CANOPY_BIN } from './lib/config.ts'

const run = createCliRunner(CANOPY_BIN, 'canopy')
const ALLOWED_SORTS = new Set(['status', 'title', 'updated_at', 'created_at', 'verification', 'priority', 'severity', 'attention'])
const ALLOWED_VIEWS = new Set([
  'all',
  'active',
  'blocked',
  'blocked_by_dependencies',
  'review',
  'handoffs',
  'follow_up_chains',
  'attention',
])
const ALLOWED_PRESETS = new Set([
  'default',
  'attention',
  'review_queue',
  'blocked',
  'blocked_by_dependencies',
  'handoffs',
  'follow_up_chains',
  'critical',
  'unacknowledged',
])
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])
const ALLOWED_SEVERITIES = new Set(['none', 'low', 'medium', 'high', 'critical'])
const ALLOWED_ATTENTION_LEVELS = new Set(['normal', 'needs_attention', 'critical'])
const ALLOWED_ACKNOWLEDGED = new Set(['true', 'false'])
const ALLOWED_TASK_ACTIONS = new Set([
  'acknowledge_task',
  'unacknowledge_task',
  'verify_task',
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
  'create_handoff',
  'post_council_message',
  'attach_evidence',
  'create_follow_up_task',
  'link_task_dependency',
])
const ALLOWED_TASK_RELATIONSHIP_ROLES = new Set(['blocks', 'blocked_by'])
const ALLOWED_HANDOFF_ACTIONS = new Set([
  'accept_handoff',
  'reject_handoff',
  'cancel_handoff',
  'complete_handoff',
  'follow_up_handoff',
  'expire_handoff',
])
const ALLOWED_VERIFICATION_STATES = new Set(['pending', 'passed', 'failed'])
const ALLOWED_HANDOFF_TYPES = new Set([
  'request_help',
  'request_review',
  'transfer_ownership',
  'request_verification',
  'record_decision',
  'close_task',
])
const ALLOWED_COUNCIL_MESSAGE_TYPES = new Set(['proposal', 'objection', 'evidence', 'decision', 'handoff', 'status'])
const ALLOWED_EVIDENCE_SOURCE_KINDS = new Set([
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

function parseJson<T>(raw: string, label: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`Invalid JSON from ${label}`)
  }
}

export async function getSnapshot<T = unknown>(options?: {
  acknowledged?: string
  attentionAtLeast?: string
  preset?: string
  priorityAtLeast?: string
  projectRoot?: string
  severityAtLeast?: string
  sort?: string
  view?: string
}): Promise<T> {
  const args = ['api', 'snapshot']
  if (options?.projectRoot) args.push('--project-root', options.projectRoot)

  const view = options?.view && ALLOWED_VIEWS.has(options.view) ? options.view : undefined
  const sort = options?.sort && ALLOWED_SORTS.has(options.sort) ? options.sort : undefined
  const preset = options?.preset && ALLOWED_PRESETS.has(options.preset) ? options.preset : undefined
  const priorityAtLeast = options?.priorityAtLeast && ALLOWED_PRIORITIES.has(options.priorityAtLeast) ? options.priorityAtLeast : undefined
  const severityAtLeast = options?.severityAtLeast && ALLOWED_SEVERITIES.has(options.severityAtLeast) ? options.severityAtLeast : undefined
  const attentionAtLeast =
    options?.attentionAtLeast && ALLOWED_ATTENTION_LEVELS.has(options.attentionAtLeast) ? options.attentionAtLeast : undefined
  const acknowledged = options?.acknowledged && ALLOWED_ACKNOWLEDGED.has(options.acknowledged) ? options.acknowledged : undefined

  if (preset && preset !== 'default') args.push('--preset', preset)
  if (view && view !== 'all') args.push('--view', view)
  if (sort && sort !== 'status') args.push('--sort', sort)
  if (priorityAtLeast) args.push('--priority-at-least', priorityAtLeast)
  if (severityAtLeast) args.push('--severity-at-least', severityAtLeast)
  if (attentionAtLeast) args.push('--attention-at-least', attentionAtLeast)
  if (acknowledged) args.push('--acknowledged', acknowledged)

  const raw = await run(args)
  return parseJson<T>(raw, 'canopy api snapshot')
}

export async function getTaskDetail<T = unknown>(taskId: string): Promise<T> {
  const raw = await run(['api', 'task', '--task-id', taskId])
  return parseJson<T>(raw, 'canopy api task')
}

export async function applyTaskAction<T = unknown>(
  taskId: string,
  input: {
    action: string
    authorAgentId?: string
    assignedTo?: string
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
    relatedTaskId?: string
    relatedFile?: string
    relatedHandoffId?: string
    relatedMemoryQuery?: string
    relatedSessionId?: string
    relatedSymbol?: string
    relationshipRole?: string
    requestedAction?: string
    severity?: string
    toAgentId?: string
    verificationState?: string
  }
): Promise<T> {
  if (!ALLOWED_TASK_ACTIONS.has(input.action)) {
    throw new Error(`Unsupported Canopy task action: ${input.action}`)
  }
  if (input.action === 'verify_task' && (!input.verificationState || !ALLOWED_VERIFICATION_STATES.has(input.verificationState))) {
    throw new Error('verify_task requires a valid verification_state')
  }
  if (input.action === 'verify_task' && input.verificationState === 'passed' && !input.closureSummary?.trim()) {
    throw new Error('verify_task passed reviews require a closure_summary')
  }
  if (input.action === 'create_handoff') {
    if (!input.fromAgentId?.trim() || !input.toAgentId?.trim()) {
      throw new Error('create_handoff requires from_agent_id and to_agent_id')
    }
    if (!input.handoffType || !ALLOWED_HANDOFF_TYPES.has(input.handoffType)) {
      throw new Error('create_handoff requires a valid handoff_type')
    }
    if (!input.handoffSummary?.trim()) {
      throw new Error('create_handoff requires a handoff_summary')
    }
  }
  if (input.action === 'post_council_message') {
    if (!input.authorAgentId?.trim()) {
      throw new Error('post_council_message requires an author_agent_id')
    }
    if (!input.messageType || !ALLOWED_COUNCIL_MESSAGE_TYPES.has(input.messageType)) {
      throw new Error('post_council_message requires a valid message_type')
    }
    if (!input.messageBody?.trim()) {
      throw new Error('post_council_message requires a message_body')
    }
  }
  if (input.action === 'attach_evidence') {
    if (!input.evidenceSourceKind || !ALLOWED_EVIDENCE_SOURCE_KINDS.has(input.evidenceSourceKind)) {
      throw new Error('attach_evidence requires a valid evidence_source_kind')
    }
    if (!input.evidenceSourceRef?.trim() || !input.evidenceLabel?.trim()) {
      throw new Error('attach_evidence requires evidence_source_ref and evidence_label')
    }
  }
  if (input.action === 'create_follow_up_task' && !input.followUpTitle?.trim()) {
    throw new Error('create_follow_up_task requires a follow_up_title')
  }
  if (input.action === 'link_task_dependency') {
    if (!input.relatedTaskId?.trim()) {
      throw new Error('link_task_dependency requires a related_task_id')
    }
    if (!input.relationshipRole || !ALLOWED_TASK_RELATIONSHIP_ROLES.has(input.relationshipRole)) {
      throw new Error('link_task_dependency requires a valid relationship_role')
    }
  }
  if ((input.action === 'resolve_dependency' || input.action === 'promote_follow_up') && !input.relatedTaskId?.trim()) {
    throw new Error(`${input.action} requires a related_task_id`)
  }

  const args = ['task', 'action', '--task-id', taskId, '--action', input.action, '--changed-by', input.changedBy]
  if (input.assignedTo) args.push('--assigned-to', input.assignedTo)
  if (input.priority && ALLOWED_PRIORITIES.has(input.priority)) args.push('--priority', input.priority)
  if (input.severity && ALLOWED_SEVERITIES.has(input.severity)) args.push('--severity', input.severity)
  if (input.verificationState && ALLOWED_VERIFICATION_STATES.has(input.verificationState)) {
    args.push('--verification-state', input.verificationState)
  }
  if (input.blockedReason) args.push('--blocked-reason', input.blockedReason)
  if (input.closureSummary) args.push('--closure-summary', input.closureSummary)
  if (input.ownerNote) args.push('--owner-note', input.ownerNote)
  if (input.clearOwnerNote) args.push('--clear-owner-note')
  if (input.note) args.push('--note', input.note)
  if (input.fromAgentId) args.push('--from-agent-id', input.fromAgentId)
  if (input.toAgentId) args.push('--to-agent-id', input.toAgentId)
  if (input.handoffType && ALLOWED_HANDOFF_TYPES.has(input.handoffType)) args.push('--handoff-type', input.handoffType)
  if (input.handoffSummary) args.push('--handoff-summary', input.handoffSummary)
  if (input.requestedAction) args.push('--requested-action', input.requestedAction)
  if (input.dueAt) args.push('--due-at', input.dueAt)
  if (input.expiresAt) args.push('--expires-at', input.expiresAt)
  if (input.authorAgentId) args.push('--author-agent-id', input.authorAgentId)
  if (input.messageType && ALLOWED_COUNCIL_MESSAGE_TYPES.has(input.messageType)) args.push('--message-type', input.messageType)
  if (input.messageBody) args.push('--message-body', input.messageBody)
  if (input.evidenceSourceKind && ALLOWED_EVIDENCE_SOURCE_KINDS.has(input.evidenceSourceKind)) {
    args.push('--evidence-source-kind', input.evidenceSourceKind)
  }
  if (input.evidenceSourceRef) args.push('--evidence-source-ref', input.evidenceSourceRef)
  if (input.evidenceLabel) args.push('--evidence-label', input.evidenceLabel)
  if (input.evidenceSummary) args.push('--evidence-summary', input.evidenceSummary)
  if (input.relatedHandoffId) args.push('--related-handoff-id', input.relatedHandoffId)
  if (input.relatedSessionId) args.push('--related-session-id', input.relatedSessionId)
  if (input.relatedMemoryQuery) args.push('--related-memory-query', input.relatedMemoryQuery)
  if (input.relatedSymbol) args.push('--related-symbol', input.relatedSymbol)
  if (input.relatedTaskId) args.push('--related-task-id', input.relatedTaskId)
  if (input.relationshipRole && ALLOWED_TASK_RELATIONSHIP_ROLES.has(input.relationshipRole)) {
    args.push('--relationship-role', input.relationshipRole)
  }
  if (input.relatedFile) args.push('--related-file', input.relatedFile)
  if (input.followUpTitle) args.push('--follow-up-title', input.followUpTitle)
  if (input.followUpDescription) args.push('--follow-up-description', input.followUpDescription)

  const raw = await run(args)
  return parseJson<T>(raw, 'canopy task action')
}

export async function applyHandoffAction<T = unknown>(
  handoffId: string,
  input: {
    action: string
    changedBy: string
    note?: string
  }
): Promise<T> {
  if (!ALLOWED_HANDOFF_ACTIONS.has(input.action)) {
    throw new Error(`Unsupported Canopy handoff action: ${input.action}`)
  }

  const args = ['handoff', 'action', '--handoff-id', handoffId, '--action', input.action, '--changed-by', input.changedBy]
  if (input.note) args.push('--note', input.note)

  const raw = await run(args)
  return parseJson<T>(raw, 'canopy handoff action')
}
