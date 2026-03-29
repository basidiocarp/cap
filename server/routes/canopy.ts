import { Hono } from 'hono'

import * as canopy from '../canopy.ts'

const app = new Hono()
const ALLOWED_SORTS = new Set(['status', 'title', 'updated_at', 'created_at', 'verification', 'priority', 'severity', 'attention'])
const ALLOWED_VIEWS = new Set([
  'all',
  'active',
  'blocked',
  'blocked_by_dependencies',
  'review',
  'handoffs',
  'follow_up_chains',
  'unclaimed',
  'claimed_not_started',
  'in_progress',
  'stalled',
  'paused_resumable',
  'awaiting_handoff_acceptance',
  'accepted_handoff_follow_through',
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
  'unclaimed',
  'claimed_not_started',
  'in_progress',
  'stalled',
  'paused_resumable',
  'awaiting_handoff_acceptance',
  'accepted_handoff_follow_through',
  'critical',
  'unacknowledged',
])
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])
const ALLOWED_SEVERITIES = new Set(['none', 'low', 'medium', 'high', 'critical'])
const ALLOWED_ATTENTION_LEVELS = new Set(['normal', 'needs_attention', 'critical'])
const ALLOWED_ACKNOWLEDGED = new Set(['true', 'false'])
const ALLOWED_VERIFICATION_STATES = new Set(['pending', 'passed', 'failed'])
const ALLOWED_TASK_ACTIONS = new Set([
  'acknowledge_task',
  'unacknowledge_task',
  'claim_task',
  'start_task',
  'resume_task',
  'pause_task',
  'yield_task',
  'complete_task',
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

app.get('/snapshot', async (c) => {
  try {
    const rawAcknowledged = c.req.query('acknowledged')
    const rawAttentionAtLeast = c.req.query('attention_at_least')
    const rawPreset = c.req.query('preset')
    const rawPriorityAtLeast = c.req.query('priority_at_least')
    const rawSort = c.req.query('sort')
    const rawSeverityAtLeast = c.req.query('severity_at_least')
    const rawView = c.req.query('view')

    return c.json(
      await canopy.getSnapshot({
        acknowledged: rawAcknowledged && ALLOWED_ACKNOWLEDGED.has(rawAcknowledged) ? rawAcknowledged : undefined,
        attentionAtLeast: rawAttentionAtLeast && ALLOWED_ATTENTION_LEVELS.has(rawAttentionAtLeast) ? rawAttentionAtLeast : undefined,
        preset: rawPreset && ALLOWED_PRESETS.has(rawPreset) ? rawPreset : undefined,
        priorityAtLeast: rawPriorityAtLeast && ALLOWED_PRIORITIES.has(rawPriorityAtLeast) ? rawPriorityAtLeast : undefined,
        projectRoot: c.req.query('project') || undefined,
        severityAtLeast: rawSeverityAtLeast && ALLOWED_SEVERITIES.has(rawSeverityAtLeast) ? rawSeverityAtLeast : undefined,
        sort: rawSort && ALLOWED_SORTS.has(rawSort) ? rawSort : undefined,
        view: rawView && ALLOWED_VIEWS.has(rawView) ? rawView : undefined,
      })
    )
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get Canopy snapshot' }, 500)
  }
})

app.get('/tasks/:taskId', async (c) => {
  try {
    return c.json(await canopy.getTaskDetail(c.req.param('taskId')))
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to get Canopy task detail' }, 500)
  }
})

app.post('/tasks/:taskId/actions', async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as {
      action?: string
      acting_agent_id?: string
      author_agent_id?: string
      assigned_to?: string
      blocked_reason?: string
      changed_by?: string
      clear_owner_note?: boolean
      closure_summary?: string
      due_at?: string
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

    if (!body.action || !body.changed_by) {
      return c.json({ error: 'Canopy task action requires action and changed_by' }, 400)
    }
    if (!ALLOWED_TASK_ACTIONS.has(body.action)) {
      return c.json({ error: `Unsupported Canopy task action: ${body.action}` }, 400)
    }
    if (
      (body.action === 'claim_task' ||
        body.action === 'start_task' ||
        body.action === 'resume_task' ||
        body.action === 'pause_task' ||
        body.action === 'yield_task' ||
        body.action === 'complete_task') &&
      !body.acting_agent_id?.trim()
    ) {
      return c.json({ error: `${body.action} requires an acting_agent_id` }, 400)
    }
    if (body.action === 'verify_task' && (!body.verification_state || !ALLOWED_VERIFICATION_STATES.has(body.verification_state))) {
      return c.json({ error: 'verify_task requires a valid verification_state' }, 400)
    }
    if (body.action === 'verify_task' && body.verification_state === 'passed' && !body.closure_summary?.trim()) {
      return c.json({ error: 'verify_task passed reviews require a closure_summary' }, 400)
    }
    if (body.action === 'create_handoff') {
      if (!body.from_agent_id?.trim() || !body.to_agent_id?.trim()) {
        return c.json({ error: 'create_handoff requires from_agent_id and to_agent_id' }, 400)
      }
      if (!body.handoff_type || !ALLOWED_HANDOFF_TYPES.has(body.handoff_type)) {
        return c.json({ error: 'create_handoff requires a valid handoff_type' }, 400)
      }
      if (!body.handoff_summary?.trim()) {
        return c.json({ error: 'create_handoff requires a handoff_summary' }, 400)
      }
    }
    if (body.action === 'post_council_message') {
      if (!body.author_agent_id?.trim()) {
        return c.json({ error: 'post_council_message requires an author_agent_id' }, 400)
      }
      if (!body.message_type || !ALLOWED_COUNCIL_MESSAGE_TYPES.has(body.message_type)) {
        return c.json({ error: 'post_council_message requires a valid message_type' }, 400)
      }
      if (!body.message_body?.trim()) {
        return c.json({ error: 'post_council_message requires a message_body' }, 400)
      }
    }
    if (body.action === 'attach_evidence') {
      if (!body.evidence_source_kind || !ALLOWED_EVIDENCE_SOURCE_KINDS.has(body.evidence_source_kind)) {
        return c.json({ error: 'attach_evidence requires a valid evidence_source_kind' }, 400)
      }
      if (!body.evidence_source_ref?.trim() || !body.evidence_label?.trim()) {
        return c.json({ error: 'attach_evidence requires evidence_source_ref and evidence_label' }, 400)
      }
    }
    if (body.action === 'create_follow_up_task' && !body.follow_up_title?.trim()) {
      return c.json({ error: 'create_follow_up_task requires a follow_up_title' }, 400)
    }
    if (body.action === 'link_task_dependency') {
      if (!body.related_task_id?.trim()) {
        return c.json({ error: 'link_task_dependency requires a related_task_id' }, 400)
      }
      if (!body.relationship_role || !ALLOWED_TASK_RELATIONSHIP_ROLES.has(body.relationship_role)) {
        return c.json({ error: 'link_task_dependency requires a valid relationship_role' }, 400)
      }
    }
    if ((body.action === 'resolve_dependency' || body.action === 'promote_follow_up') && !body.related_task_id?.trim()) {
      return c.json({ error: `${body.action} requires a related_task_id` }, 400)
    }

    return c.json(
      await canopy.applyTaskAction(c.req.param('taskId'), {
        actingAgentId: body.acting_agent_id,
        action: body.action,
        assignedTo: body.assigned_to,
        authorAgentId: body.author_agent_id,
        blockedReason: body.blocked_reason,
        changedBy: body.changed_by,
        clearOwnerNote: body.clear_owner_note,
        closureSummary: body.closure_summary,
        dueAt: body.due_at,
        evidenceLabel: body.evidence_label,
        evidenceSourceKind:
          body.evidence_source_kind && ALLOWED_EVIDENCE_SOURCE_KINDS.has(body.evidence_source_kind) ? body.evidence_source_kind : undefined,
        evidenceSourceRef: body.evidence_source_ref,
        evidenceSummary: body.evidence_summary,
        expiresAt: body.expires_at,
        followUpDescription: body.follow_up_description,
        followUpTitle: body.follow_up_title,
        fromAgentId: body.from_agent_id,
        handoffSummary: body.handoff_summary,
        handoffType: body.handoff_type && ALLOWED_HANDOFF_TYPES.has(body.handoff_type) ? body.handoff_type : undefined,
        messageBody: body.message_body,
        messageType: body.message_type && ALLOWED_COUNCIL_MESSAGE_TYPES.has(body.message_type) ? body.message_type : undefined,
        note: body.note,
        ownerNote: body.owner_note,
        priority: body.priority,
        relatedFile: body.related_file,
        relatedHandoffId: body.related_handoff_id,
        relatedMemoryQuery: body.related_memory_query,
        relatedSessionId: body.related_session_id,
        relatedSymbol: body.related_symbol,
        relatedTaskId: body.related_task_id,
        relationshipRole:
          body.relationship_role && ALLOWED_TASK_RELATIONSHIP_ROLES.has(body.relationship_role) ? body.relationship_role : undefined,
        requestedAction: body.requested_action,
        severity: body.severity,
        toAgentId: body.to_agent_id,
        verificationState:
          body.verification_state && ALLOWED_VERIFICATION_STATES.has(body.verification_state) ? body.verification_state : undefined,
      })
    )
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to apply Canopy task action' }, 500)
  }
})

app.post('/handoffs/:handoffId/actions', async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as {
      action?: string
      acting_agent_id?: string
      changed_by?: string
      note?: string
    }

    if (!body.action || !body.changed_by) {
      return c.json({ error: 'Canopy handoff action requires action and changed_by' }, 400)
    }
    if (!ALLOWED_HANDOFF_ACTIONS.has(body.action)) {
      return c.json({ error: `Unsupported Canopy handoff action: ${body.action}` }, 400)
    }
    if ((body.action === 'accept_handoff' || body.action === 'reject_handoff') && !body.acting_agent_id?.trim()) {
      return c.json({ error: `${body.action} requires an acting_agent_id` }, 400)
    }

    return c.json(
      await canopy.applyHandoffAction(c.req.param('handoffId'), {
        actingAgentId: body.acting_agent_id,
        action: body.action,
        changedBy: body.changed_by,
        note: body.note,
      })
    )
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to apply Canopy handoff action' }, 500)
  }
})

export default app
