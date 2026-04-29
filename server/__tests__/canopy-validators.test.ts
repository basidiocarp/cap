import { describe, expect, it } from 'vitest'

import { CANOPY_NOTIFICATION_EVENT_TYPES, parseNotificationRow } from '../canopy.ts'
import { validateHandoffAction, validateTaskAction } from '../lib/canopy-validators'

describe('Task action validators', () => {
  describe('validateTaskAction', () => {
    it('rejects missing action', () => {
      const result = validateTaskAction({ changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'Canopy task action requires action and changed_by', ok: false })
    })

    it('rejects missing changed_by', () => {
      const result = validateTaskAction({ action: 'claim_task' })
      expect(result).toEqual({ error: 'Canopy task action requires action and changed_by', ok: false })
    })

    it('rejects unsupported action', () => {
      const result = validateTaskAction({ action: 'invalid_action', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'Unsupported Canopy task action: invalid_action', ok: false })
    })

    it('accepts acknowledge_task with minimal fields', () => {
      const result = validateTaskAction({ action: 'acknowledge_task', changed_by: 'agent-1' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.action).toBe('acknowledge_task')
        expect(result.data.changedBy).toBe('agent-1')
      }
    })

    it('rejects claim_task without acting_agent_id', () => {
      const result = validateTaskAction({ action: 'claim_task', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'claim_task requires an acting_agent_id', ok: false })
    })

    it('accepts claim_task with acting_agent_id', () => {
      const result = validateTaskAction({ acting_agent_id: 'agent-2', action: 'claim_task', changed_by: 'agent-1' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.action).toBe('claim_task')
        expect(result.data.actingAgentId).toBe('agent-2')
      }
    })

    it('rejects verify_task without verification_state', () => {
      const result = validateTaskAction({ action: 'verify_task', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'verify_task requires a valid verification_state', ok: false })
    })

    it('rejects verify_task with invalid verification_state', () => {
      const result = validateTaskAction({ action: 'verify_task', changed_by: 'agent-1', verification_state: 'invalid' })
      expect(result).toEqual({ error: 'verify_task requires a valid verification_state', ok: false })
    })

    it('rejects verify_task with passed verification_state', () => {
      const result = validateTaskAction({ action: 'verify_task', changed_by: 'agent-1', verification_state: 'passed' })
      expect(result).toEqual({ error: 'verify_task no longer accepts passed; use close_task', ok: false })
    })

    it('accepts verify_task with pending verification_state', () => {
      const result = validateTaskAction({ action: 'verify_task', changed_by: 'agent-1', verification_state: 'pending' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.verificationState).toBe('pending')
      }
    })

    it('rejects record_decision without author_agent_id', () => {
      const result = validateTaskAction({ action: 'record_decision', changed_by: 'agent-1', message_body: 'test' })
      expect(result).toEqual({ error: 'record_decision requires an author_agent_id', ok: false })
    })

    it('rejects record_decision without message_body', () => {
      const result = validateTaskAction({ action: 'record_decision', author_agent_id: 'agent-2', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'record_decision requires a message_body', ok: false })
    })

    it('accepts record_decision with required fields', () => {
      const result = validateTaskAction({
        action: 'record_decision',
        author_agent_id: 'agent-2',
        changed_by: 'agent-1',
        message_body: 'Decision text',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.action).toBe('record_decision')
        expect(result.data.authorAgentId).toBe('agent-2')
      }
    })

    it('rejects close_task without closure_summary', () => {
      const result = validateTaskAction({ action: 'close_task', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'close_task requires a closure_summary', ok: false })
    })

    it('accepts close_task with closure_summary', () => {
      const result = validateTaskAction({ action: 'close_task', changed_by: 'agent-1', closure_summary: 'Summary' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.closureSummary).toBe('Summary')
      }
    })

    it('rejects set_task_due_at without due_at', () => {
      const result = validateTaskAction({ action: 'set_task_due_at', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'set_task_due_at requires a due_at', ok: false })
    })

    it('accepts set_task_due_at with due_at', () => {
      const result = validateTaskAction({ action: 'set_task_due_at', changed_by: 'agent-1', due_at: '2025-01-01T00:00:00Z' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.dueAt).toBe('2025-01-01T00:00:00Z')
      }
    })

    it('rejects set_review_due_at without review_due_at', () => {
      const result = validateTaskAction({ action: 'set_review_due_at', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'set_review_due_at requires a review_due_at', ok: false })
    })

    it('accepts set_review_due_at with review_due_at', () => {
      const result = validateTaskAction({ action: 'set_review_due_at', changed_by: 'agent-1', review_due_at: '2025-01-01T00:00:00Z' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.reviewDueAt).toBe('2025-01-01T00:00:00Z')
      }
    })

    it('rejects create_handoff without from_agent_id', () => {
      const result = validateTaskAction({
        action: 'create_handoff',
        changed_by: 'agent-1',
        handoff_summary: 'Help needed',
        handoff_type: 'request_help',
        to_agent_id: 'agent-2',
      })
      expect(result).toEqual({ error: 'create_handoff requires from_agent_id and to_agent_id', ok: false })
    })

    it('rejects create_handoff without handoff_type', () => {
      const result = validateTaskAction({
        action: 'create_handoff',
        changed_by: 'agent-1',
        from_agent_id: 'agent-1',
        handoff_summary: 'Help needed',
        to_agent_id: 'agent-2',
      })
      expect(result).toEqual({ error: 'create_handoff requires a valid handoff_type', ok: false })
    })

    it('rejects create_handoff without handoff_summary', () => {
      const result = validateTaskAction({
        action: 'create_handoff',
        changed_by: 'agent-1',
        from_agent_id: 'agent-1',
        handoff_type: 'request_help',
        to_agent_id: 'agent-2',
      })
      expect(result).toEqual({ error: 'create_handoff requires a handoff_summary', ok: false })
    })

    it('accepts create_handoff with all required fields', () => {
      const result = validateTaskAction({
        action: 'create_handoff',
        changed_by: 'agent-1',
        from_agent_id: 'agent-1',
        handoff_summary: 'Help needed',
        handoff_type: 'request_help',
        to_agent_id: 'agent-2',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.action).toBe('create_handoff')
        expect(result.data.handoffType).toBe('request_help')
      }
    })

    it('rejects post_council_message without author_agent_id', () => {
      const result = validateTaskAction({
        action: 'post_council_message',
        changed_by: 'agent-1',
        message_body: 'Message',
        message_type: 'proposal',
      })
      expect(result).toEqual({ error: 'post_council_message requires an author_agent_id', ok: false })
    })

    it('rejects post_council_message with invalid message_type', () => {
      const result = validateTaskAction({
        action: 'post_council_message',
        author_agent_id: 'agent-1',
        changed_by: 'agent-1',
        message_body: 'Message',
        message_type: 'invalid',
      })
      expect(result).toEqual({ error: 'post_council_message requires a valid message_type', ok: false })
    })

    it('rejects post_council_message without message_body', () => {
      const result = validateTaskAction({
        action: 'post_council_message',
        author_agent_id: 'agent-1',
        changed_by: 'agent-1',
        message_type: 'proposal',
      })
      expect(result).toEqual({ error: 'post_council_message requires a message_body', ok: false })
    })

    it('accepts post_council_message with all required fields', () => {
      const result = validateTaskAction({
        action: 'post_council_message',
        author_agent_id: 'agent-1',
        changed_by: 'agent-1',
        message_body: 'My proposal',
        message_type: 'proposal',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.messageType).toBe('proposal')
      }
    })

    it('rejects attach_evidence with invalid evidence_source_kind', () => {
      const result = validateTaskAction({
        action: 'attach_evidence',
        changed_by: 'agent-1',
        evidence_label: 'label',
        evidence_source_kind: 'invalid_kind',
        evidence_source_ref: 'ref',
      })
      expect(result).toEqual({ error: 'attach_evidence requires a valid evidence_source_kind', ok: false })
    })

    it('rejects attach_evidence without evidence_source_ref', () => {
      const result = validateTaskAction({
        action: 'attach_evidence',
        changed_by: 'agent-1',
        evidence_label: 'label',
        evidence_source_kind: 'manual_note',
      })
      expect(result).toEqual({ error: 'attach_evidence requires evidence_source_ref and evidence_label', ok: false })
    })

    it('accepts attach_evidence with valid fields', () => {
      const result = validateTaskAction({
        action: 'attach_evidence',
        changed_by: 'agent-1',
        evidence_label: 'My evidence',
        evidence_source_kind: 'manual_note',
        evidence_source_ref: 'ref-123',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.evidenceSourceKind).toBe('manual_note')
      }
    })

    // All kinds defined in septa/evidence-ref-v1.schema.json must be accepted by Cap.
    // This list must be updated manually when the septa schema adds new source_kind values.
    // Update both this constant and ALLOWED_EVIDENCE_SOURCE_KINDS in canopy-validators.ts.
    const SEPTA_EVIDENCE_SOURCE_KINDS = [
      'hyphae_session',
      'hyphae_recall',
      'hyphae_outcome',
      'cortina_event',
      'mycelium_command',
      'mycelium_explain',
      'rhizome_impact',
      'rhizome_export',
      'manual_note',
      'script_verification',
    ] as const

    it.each(SEPTA_EVIDENCE_SOURCE_KINDS)('accepts septa-defined evidence source kind: %s', (kind) => {
      const result = validateTaskAction({
        action: 'attach_evidence',
        changed_by: 'agent-1',
        evidence_label: 'label',
        evidence_source_kind: kind,
        evidence_source_ref: 'ref-123',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.evidenceSourceKind).toBe(kind)
      }
    })

    it('rejects unknown evidence source kind not in septa schema', () => {
      const result = validateTaskAction({
        action: 'attach_evidence',
        changed_by: 'agent-1',
        evidence_label: 'label',
        evidence_source_kind: 'unknown_source',
        evidence_source_ref: 'ref-123',
      })
      expect(result).toEqual({ error: 'attach_evidence requires a valid evidence_source_kind', ok: false })
    })

    it('rejects create_follow_up_task without follow_up_title', () => {
      const result = validateTaskAction({ action: 'create_follow_up_task', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'create_follow_up_task requires a follow_up_title', ok: false })
    })

    it('accepts create_follow_up_task with follow_up_title', () => {
      const result = validateTaskAction({ action: 'create_follow_up_task', changed_by: 'agent-1', follow_up_title: 'Follow up' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.followUpTitle).toBe('Follow up')
      }
    })

    it('rejects link_task_dependency without related_task_id', () => {
      const result = validateTaskAction({
        action: 'link_task_dependency',
        changed_by: 'agent-1',
        relationship_role: 'blocks',
      })
      expect(result).toEqual({ error: 'link_task_dependency requires a related_task_id', ok: false })
    })

    it('rejects link_task_dependency with invalid relationship_role', () => {
      const result = validateTaskAction({
        action: 'link_task_dependency',
        changed_by: 'agent-1',
        related_task_id: 'task-2',
        relationship_role: 'invalid_role',
      })
      expect(result).toEqual({ error: 'link_task_dependency requires a valid relationship_role', ok: false })
    })

    it('accepts link_task_dependency with valid fields', () => {
      const result = validateTaskAction({
        action: 'link_task_dependency',
        changed_by: 'agent-1',
        related_task_id: 'task-2',
        relationship_role: 'blocks',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.relationshipRole).toBe('blocks')
      }
    })

    it('rejects resolve_dependency without related_task_id', () => {
      const result = validateTaskAction({ action: 'resolve_dependency', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'resolve_dependency requires a related_task_id', ok: false })
    })

    it('rejects promote_follow_up without related_task_id', () => {
      const result = validateTaskAction({ action: 'promote_follow_up', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'promote_follow_up requires a related_task_id', ok: false })
    })

    it('preserves extra fields in validated output', () => {
      const result = validateTaskAction({
        acting_agent_id: 'agent-2',
        action: 'claim_task',
        changed_by: 'agent-1',
        note: 'My note',
        priority: 'high',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.note).toBe('My note')
        expect(result.data.priority).toBe('high')
      }
    })

    it('rejects null body', () => {
      const result = validateTaskAction(null)
      expect(result).toEqual({ error: 'Canopy task action requires action and changed_by', ok: false })
    })

    it('rejects array body', () => {
      const result = validateTaskAction([])
      expect(result).toEqual({ error: 'Canopy task action requires action and changed_by', ok: false })
    })

    it('rejects scalar body', () => {
      const result = validateTaskAction(42)
      expect(result).toEqual({ error: 'Canopy task action requires action and changed_by', ok: false })
    })

    it('rejects whitespace-only changed_by', () => {
      const result = validateTaskAction({ action: 'acknowledge_task', changed_by: '   ' })
      expect(result).toEqual({ error: 'Canopy task action requires action and changed_by', ok: false })
    })
  })

  describe('validateHandoffAction', () => {
    it('rejects missing action', () => {
      const result = validateHandoffAction({ changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'Canopy handoff action requires action and changed_by', ok: false })
    })

    it('rejects missing changed_by', () => {
      const result = validateHandoffAction({ action: 'accept_handoff' })
      expect(result).toEqual({ error: 'Canopy handoff action requires action and changed_by', ok: false })
    })

    it('rejects unsupported action', () => {
      const result = validateHandoffAction({ action: 'invalid_action', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'Unsupported Canopy handoff action: invalid_action', ok: false })
    })

    it('accepts cancel_handoff with minimal fields', () => {
      const result = validateHandoffAction({ action: 'cancel_handoff', changed_by: 'agent-1' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.action).toBe('cancel_handoff')
        expect(result.data.changedBy).toBe('agent-1')
      }
    })

    it('rejects accept_handoff without acting_agent_id', () => {
      const result = validateHandoffAction({ action: 'accept_handoff', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'accept_handoff requires an acting_agent_id', ok: false })
    })

    it('rejects reject_handoff without acting_agent_id', () => {
      const result = validateHandoffAction({ action: 'reject_handoff', changed_by: 'agent-1' })
      expect(result).toEqual({ error: 'reject_handoff requires an acting_agent_id', ok: false })
    })

    it('accepts accept_handoff with acting_agent_id', () => {
      const result = validateHandoffAction({ acting_agent_id: 'agent-2', action: 'accept_handoff', changed_by: 'agent-1' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.action).toBe('accept_handoff')
        expect(result.data.actingAgentId).toBe('agent-2')
      }
    })

    it('accepts reject_handoff with acting_agent_id', () => {
      const result = validateHandoffAction({ acting_agent_id: 'agent-2', action: 'reject_handoff', changed_by: 'agent-1' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.action).toBe('reject_handoff')
      }
    })

    it('preserves note field', () => {
      const result = validateHandoffAction({
        acting_agent_id: 'agent-2',
        action: 'reject_handoff',
        changed_by: 'agent-1',
        note: 'Rejection reason',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.note).toBe('Rejection reason')
      }
    })

    it('rejects null body', () => {
      const result = validateHandoffAction(null)
      expect(result).toEqual({ error: 'Canopy handoff action requires action and changed_by', ok: false })
    })

    it('rejects array body', () => {
      const result = validateHandoffAction([])
      expect(result).toEqual({ error: 'Canopy handoff action requires action and changed_by', ok: false })
    })

    it('rejects scalar body', () => {
      const result = validateHandoffAction(42)
      expect(result).toEqual({ error: 'Canopy handoff action requires action and changed_by', ok: false })
    })

    it('rejects whitespace-only changed_by', () => {
      const result = validateHandoffAction({ action: 'cancel_handoff', changed_by: '   ' })
      expect(result).toEqual({ error: 'Canopy handoff action requires action and changed_by', ok: false })
    })
  })
})

describe('Notification event_type enum (F2.9)', () => {
  // F2.6 and F2.7 are covered end-to-end in canopy-client.test.ts via the consumer
  // fetch functions (validators are not exported from canopy.ts). This block covers
  // F2.9: parseNotificationRow validates event_type against the closed septa enum.

  const baseRow = {
    agent_id: 'agent-1',
    created_at: '2026-04-29T12:00:00Z',
    notification_id: 'n-1',
    payload: '{}',
    seen: 0,
    task_id: 'task-1',
  }

  it('exposes all 9 schema enum values verbatim', () => {
    expect(CANOPY_NOTIFICATION_EVENT_TYPES.size).toBe(9)
    for (const value of [
      'task_assigned',
      'task_completed',
      'task_blocked',
      'task_cancelled',
      'evidence_received',
      'handoff_ready',
      'handoff_rejected',
      'council_opened',
      'council_closed',
    ]) {
      expect(CANOPY_NOTIFICATION_EVENT_TYPES.has(value)).toBe(true)
    }
  })

  it('parseNotificationRow accepts a valid event_type', () => {
    const result = parseNotificationRow({ ...baseRow, event_type: 'task_assigned' })
    expect(result).not.toBeNull()
    expect(result?.event_type).toBe('task_assigned')
  })

  it('parseNotificationRow returns null for an unknown event_type', () => {
    const result = parseNotificationRow({ ...baseRow, event_type: 'definitely_not_in_enum' })
    expect(result).toBeNull()
  })

  it('parseNotificationRow returns null for empty event_type', () => {
    const result = parseNotificationRow({ ...baseRow, event_type: '' })
    expect(result).toBeNull()
  })
})
