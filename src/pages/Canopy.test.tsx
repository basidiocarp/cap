import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CanopySnapshot, CanopyTaskDetail, ProjectInfo } from '../lib/api'
import { renderWithProviders } from '../test/render'
import { Canopy } from './Canopy'

let mockProject: ProjectInfo | null = {
  active: '/workspace/cap',
  recent: ['/workspace/cap'],
}
let mockTaskDetailError: Error | null = null
let mockSnapshotErrors: Partial<Record<string, Error>> = {}

const mockSnapshot: CanopySnapshot = {
  agent_attention: [
    {
      agent_id: 'agent-2',
      current_task_id: 'task-2',
      freshness: 'stale',
      last_heartbeat_at: '2026-03-27T10:05:00Z',
      level: 'critical',
      reasons: ['blocked_status', 'stale_heartbeat'],
    },
    {
      agent_id: 'agent-1',
      current_task_id: 'task-1',
      freshness: 'fresh',
      last_heartbeat_at: '2026-03-28T12:00:00Z',
      level: 'normal',
      reasons: [],
    },
  ],
  agent_heartbeat_summaries: [
    {
      agent_id: 'agent-2',
      current_task_id: 'task-2',
      freshness: 'stale',
      heartbeat_count: 1,
      last_heartbeat_at: '2026-03-27T10:05:00Z',
      last_status: 'blocked',
    },
    {
      agent_id: 'agent-1',
      current_task_id: 'task-1',
      freshness: 'fresh',
      heartbeat_count: 3,
      last_heartbeat_at: '2026-03-28T12:06:00Z',
      last_status: 'in_progress',
    },
  ],
  agents: [
    {
      agent_id: 'agent-2',
      current_task_id: 'task-2',
      heartbeat_at: '2026-03-27T10:05:00Z',
      host_id: 'claude',
      host_instance: 'claude-review',
      host_type: 'claude_code',
      model: 'gpt-5.4',
      project_root: '/workspace/cap',
      status: 'blocked',
      worktree_id: 'wt-2',
    },
    {
      agent_id: 'agent-1',
      current_task_id: 'task-1',
      heartbeat_at: '2026-03-28T12:00:00Z',
      host_id: 'claude',
      host_instance: 'claude-main',
      host_type: 'claude_code',
      model: 'gpt-5.4',
      project_root: '/workspace/cap',
      status: 'in_progress',
      worktree_id: 'wt-1',
    },
  ],
  attention: {
    actionable_handoffs: 1,
    actionable_tasks: 2,
    agents_needing_attention: 1,
    critical_tasks: 1,
    handoffs_needing_attention: 1,
    stale_agents: 1,
    stale_handoffs: 0,
    tasks_needing_attention: 2,
  },
  evidence: [
    {
      evidence_id: 'evidence-4',
      label: 'Operator closeout note',
      related_file: null,
      related_handoff_id: null,
      related_memory_query: null,
      related_session_id: null,
      related_symbol: null,
      source_kind: 'manual_note',
      source_ref: 'closeout-note-1',
      summary: 'Support context is already attached for closeout.',
      task_id: 'task-4',
    },
    {
      evidence_id: 'evidence-5',
      label: 'Decision packet',
      related_file: null,
      related_handoff_id: 'handoff-5',
      related_memory_query: null,
      related_session_id: null,
      related_symbol: null,
      source_kind: 'manual_note',
      source_ref: 'decision-packet-1',
      summary: 'Decision context is ready once the closeout handoff lands.',
      task_id: 'task-5',
    },
    {
      evidence_id: 'evidence-6',
      label: 'Decision recorded',
      related_file: null,
      related_handoff_id: null,
      related_memory_query: null,
      related_session_id: null,
      related_symbol: null,
      source_kind: 'manual_note',
      source_ref: 'decision-record-1',
      summary: 'The current review cycle already includes a decision note.',
      task_id: 'task-6',
    },
  ],
  execution_summaries: [
    {
      active_execution_seconds: 420,
      claim_count: 1,
      claimed_at: '2026-03-28T12:01:00Z',
      completion_count: 0,
      last_execution_action: 'start_task',
      last_execution_agent_id: 'agent-1',
      last_execution_at: '2026-03-28T12:06:00Z',
      pause_count: 0,
      run_count: 1,
      started_at: '2026-03-28T12:06:00Z',
      task_id: 'task-1',
      total_execution_seconds: 420,
      yield_count: 0,
    },
    {
      active_execution_seconds: 0,
      claim_count: 1,
      claimed_at: '2026-03-27T10:00:00Z',
      completion_count: 0,
      last_execution_action: 'pause_task',
      last_execution_agent_id: 'agent-2',
      last_execution_at: '2026-03-27T10:05:00Z',
      pause_count: 1,
      run_count: 1,
      started_at: '2026-03-27T10:01:00Z',
      task_id: 'task-2',
      total_execution_seconds: 240,
      yield_count: 0,
    },
    {
      active_execution_seconds: 0,
      claim_count: 0,
      claimed_at: null,
      completion_count: 0,
      last_execution_action: null,
      last_execution_agent_id: null,
      last_execution_at: null,
      pause_count: 0,
      run_count: 0,
      started_at: null,
      task_id: 'task-3',
      total_execution_seconds: 0,
      yield_count: 0,
    },
    {
      active_execution_seconds: 0,
      claim_count: 0,
      claimed_at: null,
      completion_count: 0,
      last_execution_action: null,
      last_execution_agent_id: null,
      last_execution_at: null,
      pause_count: 0,
      run_count: 0,
      started_at: null,
      task_id: 'task-4',
      total_execution_seconds: 0,
      yield_count: 0,
    },
    {
      active_execution_seconds: 0,
      claim_count: 0,
      claimed_at: null,
      completion_count: 0,
      last_execution_action: null,
      last_execution_agent_id: null,
      last_execution_at: null,
      pause_count: 0,
      run_count: 0,
      started_at: null,
      task_id: 'task-5',
      total_execution_seconds: 0,
      yield_count: 0,
    },
    {
      active_execution_seconds: 0,
      claim_count: 0,
      claimed_at: null,
      completion_count: 0,
      last_execution_action: null,
      last_execution_agent_id: null,
      last_execution_at: null,
      pause_count: 0,
      run_count: 0,
      started_at: null,
      task_id: 'task-6',
      total_execution_seconds: 0,
      yield_count: 0,
    },
  ],
  handoff_attention: [
    {
      freshness: 'aging',
      handoff_id: 'handoff-1',
      level: 'needs_attention',
      reasons: ['aging_open_handoff'],
      task_id: 'task-1',
    },
  ],
  handoffs: [
    {
      created_at: '2026-03-28T12:08:00Z',
      due_at: '2026-03-28T12:30:00Z',
      expires_at: '2026-03-28T13:00:00Z',
      from_agent_id: 'agent-1',
      handoff_id: 'handoff-1',
      handoff_type: 'request_review',
      requested_action: 'Review the final patch',
      resolved_at: null,
      status: 'open',
      summary: 'Need review before closing',
      task_id: 'task-1',
      to_agent_id: 'agent-2',
      updated_at: '2026-03-28T12:08:00Z',
    },
    {
      created_at: '2026-03-28T12:24:00Z',
      due_at: null,
      expires_at: null,
      from_agent_id: 'agent-1',
      handoff_id: 'handoff-5',
      handoff_type: 'record_decision',
      requested_action: 'Record the final decision before closeout',
      resolved_at: null,
      status: 'open',
      summary: 'Need the final decision before closing',
      task_id: 'task-5',
      to_agent_id: 'agent-2',
      updated_at: '2026-03-28T12:24:00Z',
    },
  ],
  heartbeats: [
    {
      agent_id: 'agent-1',
      created_at: '2026-03-28T12:06:00Z',
      current_task_id: 'task-1',
      heartbeat_id: 'hb-1',
      related_task_id: 'task-1',
      source: 'heartbeat',
      status: 'in_progress',
    },
  ],
  operator_actions: [
    {
      action_id: 'action-1',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'verify_task',
      level: 'needs_attention',
      summary: 'Verify the UI changes before closing the task.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Verify pending review',
    },
    {
      action_id: 'action-1exec',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'complete_task',
      level: 'needs_attention',
      summary: 'Complete the execution pass and move the task into review.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Complete execution on task-1',
    },
    {
      action_id: 'action-1b',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'resolve_dependency',
      level: 'needs_attention',
      summary: 'Resolve or remove the blocker relationship for this task.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Resolve dependency for task-1',
    },
    {
      action_id: 'action-1c',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'promote_follow_up',
      level: 'needs_attention',
      summary: 'Promote a follow-up task out of the current chain.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Promote follow-up on task-1',
    },
    {
      action_id: 'action-2',
      agent_id: 'agent-2',
      due_at: '2026-03-28T12:30:00Z',
      expires_at: '2026-03-28T13:00:00Z',
      handoff_id: 'handoff-1',
      kind: 'follow_up_handoff',
      level: 'needs_attention',
      summary: 'Follow up on the open review handoff before it expires.',
      target_kind: 'handoff',
      task_id: 'task-1',
      title: 'Review handoff aging',
    },
    {
      action_id: 'action-3',
      agent_id: 'agent-2',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'acknowledge_task',
      level: 'critical',
      summary: 'Acknowledge the blocked task before triage continues.',
      target_kind: 'task',
      task_id: 'task-2',
      title: 'Acknowledge blocked task',
    },
  ],
  ownership: [
    {
      assignment_count: 1,
      current_owner_agent_id: 'agent-2',
      last_assigned_at: '2026-03-27T10:00:00Z',
      last_assigned_by: 'operator',
      last_assigned_to: 'agent-2',
      last_assignment_reason: 'adapter recovery owner',
      reassignment_count: 0,
      task_id: 'task-2',
    },
    {
      assignment_count: 2,
      current_owner_agent_id: 'agent-1',
      last_assigned_at: '2026-03-28T12:04:00Z',
      last_assigned_by: 'operator',
      last_assigned_to: 'agent-1',
      last_assignment_reason: 'handoff to strongest verifier',
      reassignment_count: 1,
      task_id: 'task-1',
    },
  ],
  relationship_summaries: [
    {
      active_blocker_count: 1,
      blocker_count: 1,
      blocking_count: 0,
      follow_up_child_count: 1,
      follow_up_parent_count: 0,
      open_follow_up_child_count: 1,
      stale_blocker_count: 0,
      task_id: 'task-1',
    },
    {
      active_blocker_count: 0,
      blocker_count: 0,
      blocking_count: 1,
      follow_up_child_count: 0,
      follow_up_parent_count: 0,
      open_follow_up_child_count: 0,
      stale_blocker_count: 0,
      task_id: 'task-2',
    },
    {
      active_blocker_count: 0,
      blocker_count: 0,
      blocking_count: 0,
      follow_up_child_count: 0,
      follow_up_parent_count: 1,
      open_follow_up_child_count: 0,
      stale_blocker_count: 0,
      task_id: 'task-3',
    },
    {
      active_blocker_count: 0,
      blocker_count: 0,
      blocking_count: 0,
      follow_up_child_count: 0,
      follow_up_parent_count: 0,
      open_follow_up_child_count: 0,
      stale_blocker_count: 0,
      task_id: 'task-4',
    },
    {
      active_blocker_count: 0,
      blocker_count: 0,
      blocking_count: 0,
      follow_up_child_count: 0,
      follow_up_parent_count: 0,
      open_follow_up_child_count: 0,
      stale_blocker_count: 0,
      task_id: 'task-5',
    },
    {
      active_blocker_count: 0,
      blocker_count: 0,
      blocking_count: 0,
      follow_up_child_count: 0,
      follow_up_parent_count: 0,
      open_follow_up_child_count: 0,
      stale_blocker_count: 0,
      task_id: 'task-6',
    },
  ],
  relationships: [
    {
      created_at: '2026-03-28T12:09:00Z',
      created_by: 'operator',
      kind: 'follow_up',
      relationship_id: 'rel-1',
      source_task_id: 'task-1',
      target_task_id: 'task-3',
      updated_at: '2026-03-28T12:09:00Z',
    },
    {
      created_at: '2026-03-28T12:10:00Z',
      created_by: 'operator',
      kind: 'blocks',
      relationship_id: 'rel-2',
      source_task_id: 'task-2',
      target_task_id: 'task-1',
      updated_at: '2026-03-28T12:10:00Z',
    },
  ],
  task_attention: [
    {
      acknowledged: false,
      freshness: 'stale',
      level: 'critical',
      open_handoff_freshness: null,
      owner_heartbeat_freshness: 'stale',
      reasons: ['blocked', 'verification_failed', 'critical_severity', 'stale_owner_heartbeat', 'unacknowledged'],
      task_id: 'task-2',
    },
    {
      acknowledged: true,
      freshness: 'fresh',
      level: 'needs_attention',
      open_handoff_freshness: 'aging',
      owner_heartbeat_freshness: 'fresh',
      reasons: [
        'review_required',
        'review_with_graph_pressure',
        'review_handoff_follow_through',
        'review_awaiting_support',
        'aging_open_handoff',
      ],
      task_id: 'task-1',
    },
    {
      acknowledged: true,
      freshness: 'fresh',
      level: 'needs_attention',
      open_handoff_freshness: null,
      owner_heartbeat_freshness: null,
      reasons: ['review_required', 'review_ready_for_decision'],
      task_id: 'task-4',
    },
    {
      acknowledged: true,
      freshness: 'fresh',
      level: 'needs_attention',
      open_handoff_freshness: null,
      owner_heartbeat_freshness: null,
      reasons: ['review_required', 'review_decision_follow_through'],
      task_id: 'task-5',
    },
    {
      acknowledged: true,
      freshness: 'fresh',
      level: 'needs_attention',
      open_handoff_freshness: null,
      owner_heartbeat_freshness: null,
      reasons: ['review_required', 'review_ready_for_closeout'],
      task_id: 'task-6',
    },
  ],
  task_heartbeat_summaries: [
    {
      aging_agents: 0,
      fresh_agents: 0,
      heartbeat_count: 1,
      last_heartbeat_at: '2026-03-27T10:05:00Z',
      missing_agents: 0,
      related_agent_count: 1,
      stale_agents: 1,
      task_id: 'task-2',
    },
    {
      aging_agents: 1,
      fresh_agents: 1,
      heartbeat_count: 3,
      last_heartbeat_at: '2026-03-28T12:06:00Z',
      missing_agents: 0,
      related_agent_count: 2,
      stale_agents: 0,
      task_id: 'task-1',
    },
  ],
  tasks: [
    {
      acknowledged_at: null,
      acknowledged_by: null,
      blocked_reason: 'waiting on host repair',
      closed_at: null,
      closed_by: null,
      closure_summary: null,
      created_at: '2026-03-27T10:00:00Z',
      description: 'Repair a broken adapter',
      owner_agent_id: 'agent-2',
      owner_note: 'Waiting on a host-level fix before retrying.',
      priority: 'critical',
      project_root: '/workspace/cap',
      requested_by: 'operator',
      severity: 'critical',
      status: 'blocked',
      task_id: 'task-2',
      title: 'Fix lifecycle adapter',
      updated_at: '2026-03-27T10:00:00Z',
      verification_state: 'failed',
      verified_at: null,
      verified_by: null,
    },
    {
      acknowledged_at: '2026-03-28T12:07:00Z',
      acknowledged_by: 'operator',
      blocked_reason: null,
      closed_at: null,
      closed_by: null,
      closure_summary: null,
      created_at: '2026-03-28T11:55:00Z',
      description: 'Wire the first Cap integration path.',
      owner_agent_id: 'agent-1',
      owner_note: 'Close after UI review.',
      priority: 'high',
      project_root: '/workspace/cap',
      requested_by: 'operator',
      severity: 'medium',
      status: 'in_progress',
      task_id: 'task-1',
      title: 'Add Cap Canopy page',
      updated_at: '2026-03-28T12:10:00Z',
      verification_state: 'pending',
      verified_at: '2026-03-28T12:05:00Z',
      verified_by: 'operator',
    },
    {
      acknowledged_at: null,
      acknowledged_by: null,
      blocked_reason: null,
      closed_at: null,
      closed_by: null,
      closure_summary: null,
      created_at: '2026-03-28T12:09:00Z',
      description: 'Track the remaining operator cleanup work.',
      owner_agent_id: null,
      owner_note: null,
      priority: 'medium',
      project_root: '/workspace/cap',
      requested_by: 'operator',
      severity: 'none',
      status: 'open',
      task_id: 'task-3',
      title: 'Track rollout cleanups',
      updated_at: '2026-03-28T12:09:00Z',
      verification_state: 'unknown',
      verified_at: null,
      verified_by: null,
    },
    {
      acknowledged_at: '2026-03-28T12:22:00Z',
      acknowledged_by: 'operator',
      blocked_reason: null,
      closed_at: null,
      closed_by: null,
      closure_summary: null,
      created_at: '2026-03-28T12:20:00Z',
      description: 'Close the review once support context is confirmed.',
      owner_agent_id: null,
      owner_note: 'Support context is already attached.',
      priority: 'medium',
      project_root: '/workspace/cap',
      requested_by: 'operator',
      severity: 'low',
      status: 'review_required',
      task_id: 'task-4',
      title: 'Close review after support arrives',
      updated_at: '2026-03-28T12:22:00Z',
      verification_state: 'pending',
      verified_at: null,
      verified_by: null,
    },
    {
      acknowledged_at: '2026-03-28T12:25:00Z',
      acknowledged_by: 'operator',
      blocked_reason: null,
      closed_at: null,
      closed_by: null,
      closure_summary: null,
      created_at: '2026-03-28T12:24:00Z',
      description: 'Close the review after the final decision or closeout handoff lands.',
      owner_agent_id: null,
      owner_note: 'Decision handoff is still open.',
      priority: 'high',
      project_root: '/workspace/cap',
      requested_by: 'operator',
      severity: 'medium',
      status: 'review_required',
      task_id: 'task-5',
      title: 'Close review after decision lands',
      updated_at: '2026-03-28T12:25:00Z',
      verification_state: 'pending',
      verified_at: null,
      verified_by: null,
    },
    {
      acknowledged_at: '2026-03-28T12:28:00Z',
      acknowledged_by: 'operator',
      blocked_reason: null,
      closed_at: null,
      closed_by: null,
      closure_summary: null,
      created_at: '2026-03-28T12:27:00Z',
      description: 'Close the review after the decision is already recorded.',
      owner_agent_id: null,
      owner_note: 'Decision context is already attached.',
      priority: 'medium',
      project_root: '/workspace/cap',
      requested_by: 'operator',
      severity: 'low',
      status: 'review_required',
      task_id: 'task-6',
      title: 'Close review after decision is recorded',
      updated_at: '2026-03-28T12:28:00Z',
      verification_state: 'pending',
      verified_at: null,
      verified_by: null,
    },
  ],
}

const mockTaskDetail: CanopyTaskDetail = {
  agent_attention: [mockSnapshot.agent_attention[1]],
  agent_heartbeat_summaries: [mockSnapshot.agent_heartbeat_summaries[1]],
  allowed_actions: [
    {
      action_id: 'allowed-1',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'unacknowledge_task',
      level: 'needs_attention',
      summary: 'Update operator acknowledgment for this task.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Unacknowledge Add Cap Canopy page',
    },
    {
      action_id: 'allowed-1exec-claim',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'claim_task',
      level: 'needs_attention',
      summary: 'Claim the task for execution.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Claim Add Cap Canopy page',
    },
    {
      action_id: 'allowed-1exec-start',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'resume_task',
      level: 'needs_attention',
      summary: 'Resume active execution on the task.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Resume Add Cap Canopy page',
    },
    {
      action_id: 'allowed-1exec-pause',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'pause_task',
      level: 'needs_attention',
      summary: 'Pause active execution without yielding ownership.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Pause Add Cap Canopy page',
    },
    {
      action_id: 'allowed-1exec-yield',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'yield_task',
      level: 'needs_attention',
      summary: 'Yield the task back to the queue.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Yield Add Cap Canopy page',
    },
    {
      action_id: 'allowed-1exec-complete',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'complete_task',
      level: 'needs_attention',
      summary: 'Complete execution and move the task to review.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Complete Add Cap Canopy page',
    },
    {
      action_id: 'allowed-2',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'verify_task',
      level: 'needs_attention',
      summary: 'Record verification outcome and operator review status.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Review Add Cap Canopy page',
    },
    {
      action_id: 'allowed-3',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'reassign_task',
      level: 'needs_attention',
      summary: 'Transfer task ownership to another agent.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Reassign Add Cap Canopy page',
    },
    {
      action_id: 'allowed-4',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'set_task_priority',
      level: 'needs_attention',
      summary: 'Adjust task priority for the operator queue.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Set priority for Add Cap Canopy page',
    },
    {
      action_id: 'allowed-4b',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'resolve_dependency',
      level: 'needs_attention',
      summary: 'Remove an existing blocker relationship from this task graph.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Resolve dependency for Add Cap Canopy page',
    },
    {
      action_id: 'allowed-4c',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'promote_follow_up',
      level: 'needs_attention',
      summary: 'Detach one follow-up task from the current chain.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Promote follow-up on Add Cap Canopy page',
    },
    {
      action_id: 'allowed-5',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'set_task_severity',
      level: 'needs_attention',
      summary: 'Adjust task severity for triage and reporting.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Set severity for Add Cap Canopy page',
    },
    {
      action_id: 'allowed-6',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'update_task_note',
      level: 'needs_attention',
      summary: 'Add or clear operator context on the task.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Update note for Add Cap Canopy page',
    },
    {
      action_id: 'allowed-7',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'create_handoff',
      level: 'needs_attention',
      summary: 'Create a new handoff from the operator console.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Create handoff for Add Cap Canopy page',
    },
    {
      action_id: 'allowed-8',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'post_council_message',
      level: 'needs_attention',
      summary: 'Post a new council message on the task thread.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Post council message for Add Cap Canopy page',
    },
    {
      action_id: 'allowed-9',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'attach_evidence',
      level: 'needs_attention',
      summary: 'Attach supporting evidence and navigation context to the task.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Attach evidence to Add Cap Canopy page',
    },
    {
      action_id: 'allowed-10',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'create_follow_up_task',
      level: 'needs_attention',
      summary: 'Create a follow-up task in the same project from this task detail.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Create follow-up task for Add Cap Canopy page',
    },
    {
      action_id: 'allowed-10b',
      agent_id: 'agent-1',
      due_at: null,
      expires_at: null,
      handoff_id: null,
      kind: 'link_task_dependency',
      level: 'needs_attention',
      summary: 'Link this task to another task as blocking or blocked-by.',
      target_kind: 'task',
      task_id: 'task-1',
      title: 'Link dependency for Add Cap Canopy page',
    },
    {
      action_id: 'allowed-11',
      agent_id: 'agent-2',
      due_at: '2026-03-28T12:30:00Z',
      expires_at: '2026-03-28T13:00:00Z',
      handoff_id: 'handoff-1',
      kind: 'accept_handoff',
      level: 'needs_attention',
      summary: 'Accept the open handoff and record ownership or review uptake.',
      target_kind: 'handoff',
      task_id: 'task-1',
      title: 'Accept handoff-1',
    },
    {
      action_id: 'allowed-12',
      agent_id: 'agent-2',
      due_at: '2026-03-28T12:30:00Z',
      expires_at: '2026-03-28T13:00:00Z',
      handoff_id: 'handoff-1',
      kind: 'reject_handoff',
      level: 'needs_attention',
      summary: 'Reject the open handoff without completing the requested action.',
      target_kind: 'handoff',
      task_id: 'task-1',
      title: 'Reject handoff-1',
    },
    {
      action_id: 'allowed-13',
      agent_id: 'agent-2',
      due_at: '2026-03-28T12:30:00Z',
      expires_at: '2026-03-28T13:00:00Z',
      handoff_id: 'handoff-1',
      kind: 'cancel_handoff',
      level: 'needs_attention',
      summary: 'Cancel the open handoff when the request is no longer needed.',
      target_kind: 'handoff',
      task_id: 'task-1',
      title: 'Cancel handoff-1',
    },
    {
      action_id: 'allowed-14',
      agent_id: 'agent-2',
      due_at: '2026-03-28T12:30:00Z',
      expires_at: '2026-03-28T13:00:00Z',
      handoff_id: 'handoff-1',
      kind: 'complete_handoff',
      level: 'needs_attention',
      summary: 'Mark the open handoff as completed once the requested work lands.',
      target_kind: 'handoff',
      task_id: 'task-1',
      title: 'Complete handoff-1',
    },
    {
      action_id: 'allowed-15',
      agent_id: 'agent-2',
      due_at: '2026-03-28T12:30:00Z',
      expires_at: '2026-03-28T13:00:00Z',
      handoff_id: 'handoff-1',
      kind: 'follow_up_handoff',
      level: 'needs_attention',
      summary: 'Need review before closing',
      target_kind: 'handoff',
      task_id: 'task-1',
      title: 'Follow up handoff-1',
    },
    {
      action_id: 'allowed-16',
      agent_id: 'agent-2',
      due_at: '2026-03-28T12:30:00Z',
      expires_at: '2026-03-28T13:00:00Z',
      handoff_id: 'handoff-1',
      kind: 'expire_handoff',
      level: 'needs_attention',
      summary: 'Resolve the open handoff as expired.',
      target_kind: 'handoff',
      task_id: 'task-1',
      title: 'Expire handoff-1',
    },
  ],
  assignments: [
    {
      assigned_at: '2026-03-28T12:01:00Z',
      assigned_by: 'operator',
      assigned_to: 'agent-2',
      assignment_id: 'assign-1',
      reason: 'initial UI pass',
      task_id: 'task-1',
    },
    {
      assigned_at: '2026-03-28T12:04:00Z',
      assigned_by: 'operator',
      assigned_to: 'agent-1',
      assignment_id: 'assign-2',
      reason: 'handoff to strongest verifier',
      task_id: 'task-1',
    },
  ],
  attention: mockSnapshot.task_attention[1],
  events: [
    {
      actor: 'operator',
      created_at: '2026-03-28T12:00:00Z',
      event_id: 'evt-1',
      event_type: 'created',
      execution_action: null,
      execution_duration_seconds: null,
      from_status: null,
      note: 'Wire the first Cap integration path.',
      owner_agent_id: null,
      task_id: 'task-1',
      to_status: 'open',
      verification_state: 'unknown',
    },
    {
      actor: 'agent-1',
      created_at: '2026-03-28T12:06:00Z',
      event_id: 'evt-2',
      event_type: 'execution_updated',
      execution_action: 'start_task',
      execution_duration_seconds: null,
      from_status: 'assigned',
      note: 'Operator resumed active work',
      owner_agent_id: 'agent-1',
      task_id: 'task-1',
      to_status: 'in_progress',
      verification_state: 'pending',
    },
    {
      actor: 'operator',
      created_at: '2026-03-28T12:07:00Z',
      event_id: 'evt-3',
      event_type: 'triage_updated',
      execution_action: null,
      execution_duration_seconds: null,
      from_status: 'in_progress',
      note: 'priority=high; acknowledged=true; owner_note_updated=true',
      owner_agent_id: 'agent-1',
      task_id: 'task-1',
      to_status: 'in_progress',
      verification_state: 'pending',
    },
  ],
  evidence: [
    {
      evidence_id: 'evidence-1',
      label: 'Hyphae session',
      related_file: null,
      related_handoff_id: null,
      related_memory_query: null,
      related_session_id: 'ses_123',
      related_symbol: null,
      source_kind: 'hyphae_session',
      source_ref: 'ses_123',
      summary: 'Task work linked to a Hyphae session.',
      task_id: 'task-1',
    },
    {
      evidence_id: 'evidence-2',
      label: 'Recall signal',
      related_file: null,
      related_handoff_id: null,
      related_memory_query: 'task:cap-canopy',
      related_session_id: null,
      related_symbol: null,
      source_kind: 'hyphae_recall',
      source_ref: 'memory-topic',
      summary: 'Recall evidence for the task.',
      task_id: 'task-1',
    },
    {
      evidence_id: 'evidence-3',
      label: 'Rhizome impact',
      related_file: '/workspace/cap/src/pages/Canopy.tsx',
      related_handoff_id: null,
      related_memory_query: null,
      related_session_id: null,
      related_symbol: 'Canopy',
      source_kind: 'rhizome_impact',
      source_ref: 'AddCapCanopyPage',
      summary: 'Impact analysis captured in Rhizome.',
      task_id: 'task-1',
    },
  ],
  execution_summary: mockSnapshot.execution_summaries[0],
  handoff_attention: mockSnapshot.handoff_attention,
  handoffs: mockSnapshot.handoffs,
  heartbeat_summary: mockSnapshot.task_heartbeat_summaries[1],
  heartbeats: mockSnapshot.heartbeats,
  messages: [
    {
      author_agent_id: 'agent-1',
      body: 'Ready for review.',
      message_id: 'msg-1',
      message_type: 'status',
      task_id: 'task-1',
    },
  ],
  operator_actions: mockSnapshot.operator_actions.filter((action) => action.task_id === 'task-1'),
  ownership: mockSnapshot.ownership[1],
  related_tasks: [
    {
      blocked_reason: 'waiting on host repair',
      created_at: '2026-03-27T10:00:00Z',
      owner_agent_id: 'agent-2',
      priority: 'critical',
      related_task_id: 'task-2',
      relationship_id: 'rel-2',
      relationship_kind: 'blocks',
      relationship_role: 'blocked_by',
      severity: 'critical',
      status: 'blocked',
      title: 'Fix lifecycle adapter',
      updated_at: '2026-03-27T10:00:00Z',
      verification_state: 'failed',
    },
    {
      blocked_reason: null,
      created_at: '2026-03-28T12:09:00Z',
      owner_agent_id: null,
      priority: 'medium',
      related_task_id: 'task-3',
      relationship_id: 'rel-1',
      relationship_kind: 'follow_up',
      relationship_role: 'follow_up_child',
      severity: 'none',
      status: 'open',
      title: 'Track rollout cleanups',
      updated_at: '2026-03-28T12:09:00Z',
      verification_state: 'unknown',
    },
  ],
  relationship_summary: mockSnapshot.relationship_summaries[0],
  relationships: mockSnapshot.relationships.filter(
    (relationship) => relationship.source_task_id === 'task-1' || relationship.target_task_id === 'task-1'
  ),
  task: mockSnapshot.tasks[1],
}

let currentTaskDetail: CanopyTaskDetail = structuredClone(mockTaskDetail)

function snapshotForTaskIds(taskIds: string[]): CanopySnapshot {
  const allowedTaskIds = new Set(taskIds)
  const allowedAgentIds = new Set(
    mockSnapshot.tasks
      .filter((task) => allowedTaskIds.has(task.task_id))
      .map((task) => task.owner_agent_id)
      .filter(Boolean)
  )
  const orderedTasks = taskIds
    .map((taskId) => mockSnapshot.tasks.find((task) => task.task_id === taskId))
    .filter((task): task is CanopySnapshot['tasks'][number] => Boolean(task))

  return {
    ...mockSnapshot,
    agent_attention: mockSnapshot.agent_attention.filter((attention) => {
      const taskMatch = attention.current_task_id ? allowedTaskIds.has(attention.current_task_id) : false
      return taskMatch || allowedAgentIds.has(attention.agent_id)
    }),
    agent_heartbeat_summaries: mockSnapshot.agent_heartbeat_summaries.filter((summary) => {
      const taskMatch = summary.current_task_id ? allowedTaskIds.has(summary.current_task_id) : false
      return taskMatch || allowedAgentIds.has(summary.agent_id)
    }),
    evidence: mockSnapshot.evidence.filter((item) => allowedTaskIds.has(item.task_id)),
    execution_summaries: mockSnapshot.execution_summaries.filter((summary) => allowedTaskIds.has(summary.task_id)),
    handoff_attention: mockSnapshot.handoff_attention.filter((attention) => allowedTaskIds.has(attention.task_id)),
    handoffs: mockSnapshot.handoffs.filter((handoff) => allowedTaskIds.has(handoff.task_id)),
    heartbeats: mockSnapshot.heartbeats.filter((heartbeat) => {
      const currentMatches = heartbeat.current_task_id ? allowedTaskIds.has(heartbeat.current_task_id) : false
      const relatedMatches = heartbeat.related_task_id ? allowedTaskIds.has(heartbeat.related_task_id) : false
      return currentMatches || relatedMatches
    }),
    operator_actions: mockSnapshot.operator_actions.filter((action) => (action.task_id ? allowedTaskIds.has(action.task_id) : false)),
    ownership: mockSnapshot.ownership.filter((ownership) => allowedTaskIds.has(ownership.task_id)),
    relationship_summaries: mockSnapshot.relationship_summaries.filter((summary) => allowedTaskIds.has(summary.task_id)),
    relationships: mockSnapshot.relationships.filter(
      (relationship) => allowedTaskIds.has(relationship.source_task_id) || allowedTaskIds.has(relationship.target_task_id)
    ),
    task_attention: mockSnapshot.task_attention.filter((attention) => allowedTaskIds.has(attention.task_id)),
    task_heartbeat_summaries: mockSnapshot.task_heartbeat_summaries.filter((summary) => allowedTaskIds.has(summary.task_id)),
    tasks: orderedTasks,
  }
}

function responseKey(options?: {
  acknowledged?: string
  preset?: string
  priorityAtLeast?: string
  project?: string
  severityAtLeast?: string
  sort?: string
  view?: string
}): string {
  return JSON.stringify({
    acknowledged: options?.acknowledged ?? null,
    preset: options?.preset ?? options?.view ?? 'default',
    priorityAtLeast: options?.priorityAtLeast ?? null,
    project: options?.project ?? null,
    severityAtLeast: options?.severityAtLeast ?? null,
    sort: options?.sort ?? null,
  })
}

const SNAPSHOT_RESPONSES = new Map<string, CanopySnapshot>([
  [responseKey({ preset: 'critical', project: '/workspace/cap' }), snapshotForTaskIds(['task-2'])],
  [responseKey({ preset: 'unacknowledged', project: '/workspace/cap' }), snapshotForTaskIds(['task-2'])],
  [responseKey({ preset: 'unacknowledged', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-2'])],
  [responseKey({ preset: 'blocked', project: '/workspace/cap' }), snapshotForTaskIds(['task-2'])],
  [responseKey({ preset: 'blocked_by_dependencies', project: '/workspace/cap' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'review_with_graph_pressure', project: '/workspace/cap' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'review_with_graph_pressure', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'review_handoff_follow_through', project: '/workspace/cap' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'review_handoff_follow_through', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'review_decision_follow_through', project: '/workspace/cap' }), snapshotForTaskIds(['task-5'])],
  [responseKey({ preset: 'review_decision_follow_through', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-5'])],
  [responseKey({ preset: 'review_awaiting_support', project: '/workspace/cap' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'review_awaiting_support', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'review_ready_for_decision', project: '/workspace/cap' }), snapshotForTaskIds(['task-4'])],
  [responseKey({ preset: 'review_ready_for_decision', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-4'])],
  [responseKey({ preset: 'review_ready_for_closeout', project: '/workspace/cap' }), snapshotForTaskIds(['task-6'])],
  [responseKey({ preset: 'review_ready_for_closeout', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-6'])],
  [responseKey({ preset: 'handoffs', project: '/workspace/cap' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'unclaimed', project: '/workspace/cap' }), snapshotForTaskIds(['task-3'])],
  [responseKey({ preset: 'unclaimed', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-3'])],
  [responseKey({ preset: 'assigned_awaiting_claim', project: '/workspace/cap' }), snapshotForTaskIds([])],
  [responseKey({ preset: 'assigned_awaiting_claim', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds([])],
  [responseKey({ preset: 'claimed_not_started', project: '/workspace/cap' }), snapshotForTaskIds([])],
  [responseKey({ preset: 'claimed_not_started', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds([])],
  [responseKey({ preset: 'in_progress', project: '/workspace/cap' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'in_progress', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'stalled', project: '/workspace/cap' }), snapshotForTaskIds(['task-2'])],
  [responseKey({ preset: 'stalled', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-2'])],
  [responseKey({ preset: 'paused_resumable', project: '/workspace/cap' }), snapshotForTaskIds([])],
  [responseKey({ preset: 'paused_resumable', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds([])],
  [responseKey({ preset: 'awaiting_handoff_acceptance', project: '/workspace/cap' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'awaiting_handoff_acceptance', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'accepted_handoff_follow_through', project: '/workspace/cap' }), snapshotForTaskIds([])],
  [responseKey({ preset: 'follow_up_chains', project: '/workspace/cap' }), snapshotForTaskIds(['task-1', 'task-3'])],
  [responseKey({ preset: 'handoffs', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'review_queue', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'review_queue', project: '/workspace/cap', sort: 'updated_at' }), snapshotForTaskIds(['task-1'])],
  [responseKey({ preset: 'critical', project: '/workspace/cap', sort: 'attention' }), snapshotForTaskIds(['task-2'])],
  [
    responseKey({
      acknowledged: 'true',
      preset: 'default',
      priorityAtLeast: 'critical',
      project: '/workspace/cap',
      severityAtLeast: 'critical',
      sort: 'updated_at',
    }),
    snapshotForTaskIds(['task-1']),
  ],
  [
    responseKey({
      acknowledged: 'false',
      preset: 'default',
      priorityAtLeast: 'high',
      project: '/workspace/cap',
      severityAtLeast: 'critical',
      sort: 'status',
    }),
    snapshotForTaskIds(['task-2']),
  ],
  [
    responseKey({
      preset: 'default',
      priorityAtLeast: 'critical',
      project: '/workspace/cap',
      sort: 'status',
    }),
    snapshotForTaskIds(['task-2']),
  ],
  [responseKey({ preset: 'default', project: '/workspace/cap', sort: 'status' }), snapshotForTaskIds(['task-2', 'task-1'])],
  [responseKey({ preset: 'default', project: '/workspace/cap', sort: 'updated_at' }), snapshotForTaskIds(['task-1', 'task-2'])],
  [responseKey({ project: '/workspace/cap', sort: 'updated_at' }), snapshotForTaskIds(['task-1', 'task-2'])],
])

const useCanopySnapshotMock = vi.fn(
  (options?: {
    acknowledged?: string
    preset?: string
    priorityAtLeast?: string
    project?: string
    severityAtLeast?: string
    sort?: string
    view?: string
  }) => {
    const key = responseKey(options)
    const data = SNAPSHOT_RESPONSES.get(key)
    const error = mockSnapshotErrors[key] ?? null

    if (!data && !error) {
      throw new Error(`Unhandled Canopy snapshot test query: ${key}`)
    }

    return {
      data,
      error,
      isLoading: false,
    }
  }
)
const taskActionMutateMock = vi.fn()
const handoffActionMutateMock = vi.fn()
const useCanopyTaskActionMock = vi.fn(() => ({
  error: null,
  isPending: false,
  mutate: taskActionMutateMock,
}))
const useCanopyHandoffActionMock = vi.fn(() => ({
  error: null,
  isPending: false,
  mutate: handoffActionMutateMock,
}))

vi.mock('../lib/queries', () => ({
  useCanopyHandoffAction: () => useCanopyHandoffActionMock(),
  useCanopySnapshot: (options?: {
    acknowledged?: string
    preset?: string
    priorityAtLeast?: string
    project?: string
    severityAtLeast?: string
    sort?: string
    view?: string
  }) => useCanopySnapshotMock(options),
  useCanopyTaskAction: () => useCanopyTaskActionMock(),
  useCanopyTaskDetail: (taskId: string) => ({
    data: taskId && !mockTaskDetailError ? currentTaskDetail : undefined,
    error: mockTaskDetailError,
    isLoading: false,
  }),
  useProjectContextController: () => ({
    data: mockProject,
    isLoading: false,
  }),
}))

describe('Canopy page', () => {
  beforeEach(() => {
    mockProject = { active: '/workspace/cap', recent: ['/workspace/cap'] }
    mockTaskDetailError = null
    mockSnapshotErrors = {}
    currentTaskDetail = structuredClone(mockTaskDetail)
    useCanopySnapshotMock.mockClear()
    useCanopyTaskActionMock.mockClear()
    useCanopyHandoffActionMock.mockClear()
    taskActionMutateMock.mockClear()
    handoffActionMutateMock.mockClear()
  })

  it('renders a project-scoped operator board from the Canopy snapshot', () => {
    renderWithProviders(<Canopy />, { route: '/canopy' })

    expect(screen.getByRole('heading', { name: 'Canopy' })).toBeInTheDocument()
    expect(screen.getByText('Showing Canopy coordination state for /workspace/cap.')).toBeInTheDocument()
    expect(screen.getByText('Add Cap Canopy page')).toBeInTheDocument()
    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.getByText('1 critical tasks')).toBeInTheDocument()
    expect(screen.getByText('2 need attention')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Critical · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unacknowledged · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unclaimed · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'In progress · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stalled · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review / graph pressure · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review / handoff follow-through · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review / decision or closeout · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review / awaiting support · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review / ready for decision · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review / ready for closeout · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open handoffs · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Awaiting handoff acceptance · 1' })).toBeInTheDocument()
    expect(screen.getByText(/Assignments 2 · reassignments 1/)).toBeInTheDocument()
    expect(screen.getByText(/Execution 1 runs · 420s total · active 420s · last start task/)).toBeInTheDocument()
    expect(screen.getByText('verify task')).toBeInTheDocument()
  })

  it('filters tasks by query and status from the URL', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?q=lifecycle&status=blocked' })

    expect(screen.getByDisplayValue('lifecycle')).toBeInTheDocument()
    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
  })

  it('applies saved views and sorting from the URL', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?preset=review_queue&sort=updated_at' })

    expect(screen.getByDisplayValue('updated_at')).toBeInTheDocument()
    expect(screen.getByText('Review queue')).toBeInTheDocument()
    expect(screen.getByText('Add Cap Canopy page')).toBeInTheDocument()
    expect(screen.queryByText('Fix lifecycle adapter')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'review_queue',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: 'updated_at',
    })
  })

  it('supports the runtime critical queue', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?preset=critical&sort=attention' })

    expect(screen.getByText('Critical queue')).toBeInTheDocument()
    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'critical',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: 'attention',
    })
  })

  it('resets ad hoc filters when opening a saved view', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, {
      route: '/canopy?priority=critical&severity=critical&ack=true&status=blocked&q=adapter&sort=updated_at',
    })

    await user.click(screen.getByRole('button', { name: 'Review queue' }))

    expect(screen.getByText('Add Cap Canopy page')).toBeInTheDocument()
    expect(screen.queryByText('Fix lifecycle adapter')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'review_queue',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: 'status',
    })
  })

  it('opens the runtime unacknowledged queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, {
      route: '/canopy?priority=critical&severity=critical&ack=true&status=review_required&q=cap&sort=updated_at',
    })

    await user.click(screen.getByRole('button', { name: 'Unacknowledged · 1' }))

    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'unacknowledged',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the runtime handoff queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy?priority=critical&status=blocked&q=adapter' })

    await user.click(screen.getByRole('button', { name: 'Open handoffs · 1' }))

    expect(screen.getByText('Add Cap Canopy page')).toBeInTheDocument()
    expect(screen.queryByText('Fix lifecycle adapter')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'handoffs',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the runtime stalled queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    await user.click(screen.getByRole('button', { name: 'Stalled · 1' }))

    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'stalled',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the runtime review graph pressure queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    await user.click(screen.getByRole('button', { name: 'Review / graph pressure · 1' }))

    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'review_with_graph_pressure',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the runtime review handoff follow-through queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    await user.click(screen.getByRole('button', { name: 'Review / handoff follow-through · 1' }))

    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'review_handoff_follow_through',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the runtime review decision or closeout queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    await user.click(screen.getByRole('button', { name: 'Review / decision or closeout · 1' }))

    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'review_decision_follow_through',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the runtime review awaiting support queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    await user.click(screen.getByRole('button', { name: 'Review / awaiting support · 1' }))

    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'review_awaiting_support',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the runtime review ready for decision queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    await user.click(screen.getByRole('button', { name: 'Review / ready for decision · 1' }))

    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'review_ready_for_decision',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the runtime review ready for closeout queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    await user.click(screen.getByRole('button', { name: 'Review / ready for closeout · 1' }))

    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'review_ready_for_closeout',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the paused resumable queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    await user.click(screen.getByRole('button', { name: 'Paused / resumable · 0' }))

    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'paused_resumable',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the claimed not started queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    await user.click(screen.getByRole('button', { name: 'Claimed / not started · 0' }))

    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'claimed_not_started',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('opens the assigned awaiting claim queue from the operator shortcut', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    await user.click(screen.getByRole('button', { name: 'Assigned / awaiting claim · 0' }))

    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'assigned_awaiting_claim',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: undefined,
    })
  })

  it('shows queue fetch failures instead of silently rendering zero counts', () => {
    mockSnapshotErrors[responseKey({ preset: 'critical', project: '/workspace/cap' })] = new Error('critical queue failed')

    renderWithProviders(<Canopy />, { route: '/canopy' })

    expect(screen.getByText('critical queue failed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Critical · error' })).toBeInTheDocument()
  })

  it('supports runtime triage filters', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?priority=high&severity=critical&ack=false' })

    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: 'false',
      preset: 'default',
      priorityAtLeast: 'high',
      project: '/workspace/cap',
      severityAtLeast: 'critical',
      sort: 'status',
    })
  })

  it('renders non-status sorts as a flat ordered list', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?sort=updated_at' })

    const taskTitles = screen.getAllByText(/Add Cap Canopy page|Fix lifecycle adapter/).map((node) => node.textContent)
    expect(taskTitles).toEqual(['Add Cap Canopy page', 'Fix lifecycle adapter'])
  })

  it('falls back to default query-state when URL values are invalid', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?preset=bogus&priority=nope&severity=nope&ack=nope&sort=bogus&status=nope' })

    expect(screen.getByDisplayValue('status')).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('all').length).toBeGreaterThan(0)
    expect(screen.getByText('All tasks')).toBeInTheDocument()
    expect(useCanopySnapshotMock).toHaveBeenCalledWith({
      acknowledged: undefined,
      preset: 'default',
      priorityAtLeast: undefined,
      project: '/workspace/cap',
      severityAtLeast: undefined,
      sort: 'status',
    })
  })

  it('scopes active agents to the visible task slice', () => {
    renderWithProviders(<Canopy />, { route: '/canopy?status=blocked' })

    const activeAgentsCard = screen.getByRole('heading', { name: 'Active Agents' }).closest('div')
    expect(activeAgentsCard?.textContent).toContain('1')
    expect(screen.getByText('1 stale agents')).toBeInTheDocument()
    expect(screen.queryByText('Add Cap Canopy page')).not.toBeInTheDocument()
    expect(screen.getByText('Fix lifecycle adapter')).toBeInTheDocument()
  })

  it('opens task detail drilldown from the board', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy' })

    const [openTaskButton] = screen.getAllByRole('button', { name: 'Open task detail' })
    expect(openTaskButton).toBeDefined()

    await user.click(openTaskButton)

    expect(await screen.findByText(/Task ID:/)).toBeInTheDocument()
    expect(screen.getAllByText('needs attention').length).toBeGreaterThan(0)
    expect(screen.getByText(/Attention reasons:/)).toBeInTheDocument()
    expect(screen.getAllByText('priority high').length).toBeGreaterThan(0)
    expect(screen.getAllByText('severity medium').length).toBeGreaterThan(0)
    expect(screen.getAllByText('acknowledged').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Operator note:/).length).toBeGreaterThan(0)
    expect(screen.getByText('blocked by 1')).toBeInTheDocument()
    expect(screen.getByText('follow-ups 1')).toBeInTheDocument()
    expect(screen.getByText(/Owner heartbeat freshness:/)).toBeInTheDocument()
    expect(screen.getByText('Runtime Summary')).toBeInTheDocument()
    expect(screen.getByText('Coordination Actions')).toBeInTheDocument()
    expect(screen.getByText('Current owner: agent-1')).toBeInTheDocument()
    expect(screen.getByText('Assignments: 2')).toBeInTheDocument()
    expect(screen.getByText(/Freshness: 1 fresh · 1 aging · 0 stale · 0 missing/)).toBeInTheDocument()
    expect(screen.getByText('Verify pending review')).toBeInTheDocument()
    expect(screen.getByText('Review handoff aging')).toBeInTheDocument()
    expect(await screen.findByText('Task created')).toBeInTheDocument()
    expect(screen.getByText('Triage updated')).toBeInTheDocument()
    expect(screen.getByText('Heartbeats')).toBeInTheDocument()
    expect(screen.getByText('Agent Attention')).toBeInTheDocument()
    expect(screen.getAllByText('Agent: agent-1').length).toBeGreaterThan(0)
    expect(screen.getByText(/Heartbeats 3 · latest status in_progress/)).toBeInTheDocument()
    expect(screen.getByText('Execution Summary')).toBeInTheDocument()
    expect(screen.getByText('Claims: 1')).toBeInTheDocument()
    expect(screen.getByText(/Runs: 1 · pauses 0 · yields 0/)).toBeInTheDocument()
    expect(screen.getByText(/Completions: 0 · total 420s/)).toBeInTheDocument()
    expect(screen.getByText(/Active execution: 420s/)).toBeInTheDocument()
    expect(screen.getByText('Review state: waiting on evidence or a council decision')).toBeInTheDocument()
    expect(screen.getByText(/Last start task/)).toBeInTheDocument()
    expect(screen.getByText('Assignments')).toBeInTheDocument()
    expect(screen.getByText('operator → agent-1')).toBeInTheDocument()
    expect(screen.getAllByText('Reason: handoff to strongest verifier').length).toBeGreaterThan(0)
    expect(screen.getByText('Execution start task')).toBeInTheDocument()
    expect(screen.getByText('Need review before closing')).toBeInTheDocument()
    expect(screen.getByText('blocked by')).toBeInTheDocument()
    expect(screen.getByText('follow-up')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fix lifecycle adapter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Track rollout cleanups' })).toBeInTheDocument()
    expect(screen.getAllByText(/Due /).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Expires /).length).toBeGreaterThan(0)
    expect(screen.getByText('Ready for review.')).toBeInTheDocument()
    expect(screen.getAllByText('Hyphae session').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Open session' })).toHaveAttribute('href', '/sessions?session=ses_123')
    expect(screen.getByRole('link', { name: 'Search memories' })).toHaveAttribute('href', '/memories?q=task%3Acap-canopy')
    expect(screen.getByRole('link', { name: 'Open code explorer' })).toHaveAttribute(
      'href',
      '/code?file=%2Fworkspace%2Fcap%2Fsrc%2Fpages%2FCanopy.tsx&symbol=Canopy'
    )
  })

  it('forwards operator actions from the task detail modal', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Canopy />, { route: '/canopy?task=task-1' })

    await user.type(screen.getByLabelText('Review note'), 'Needs another pass')
    await user.click(screen.getByRole('button', { name: 'Record review' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'verify_task',
      changed_by: 'operator',
      closure_summary: undefined,
      note: 'Needs another pass',
      taskId: 'task-1',
      verification_state: 'pending',
    })

    await user.click(screen.getByRole('button', { name: 'Unacknowledge' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'unacknowledge_task',
      changed_by: 'operator',
      taskId: 'task-1',
    })

    await user.click(screen.getByRole('button', { name: 'Pause task' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      acting_agent_id: 'agent-1',
      action: 'pause_task',
      changed_by: 'operator',
      note: undefined,
      taskId: 'task-1',
    })

    await user.click(screen.getByRole('button', { name: 'Resume task' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      acting_agent_id: 'agent-1',
      action: 'resume_task',
      changed_by: 'operator',
      note: undefined,
      taskId: 'task-1',
    })

    await user.click(screen.getByRole('button', { name: 'Save priority' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'set_task_priority',
      changed_by: 'operator',
      priority: 'high',
      taskId: 'task-1',
    })

    await user.type(screen.getByLabelText('Graph action note'), 'Dependency landed in the runtime')
    await user.click(screen.getByRole('button', { name: 'Resolve dependency' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'resolve_dependency',
      changed_by: 'operator',
      note: 'Dependency landed in the runtime',
      related_task_id: 'task-2',
      taskId: 'task-1',
    })

    await user.click(screen.getByRole('button', { name: 'Promote follow-up' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'promote_follow_up',
      changed_by: 'operator',
      note: 'Dependency landed in the runtime',
      related_task_id: 'task-3',
      taskId: 'task-1',
    })

    await user.click(screen.getByRole('button', { name: 'Nudge handoff' }))
    expect(handoffActionMutateMock).toHaveBeenCalledWith({
      action: 'follow_up_handoff',
      changed_by: 'operator',
      handoffId: 'handoff-1',
      note: undefined,
      taskId: 'task-1',
    })

    await user.click(screen.getByRole('button', { name: 'Accept handoff' }))
    await waitFor(() =>
      expect(handoffActionMutateMock).toHaveBeenCalledWith({
        acting_agent_id: 'agent-2',
        action: 'accept_handoff',
        changed_by: 'operator',
        handoffId: 'handoff-1',
        note: undefined,
        taskId: 'task-1',
      })
    )

    await user.type(screen.getByLabelText('Handoff summary'), 'Review the next coordination step')
    await user.type(screen.getByLabelText('Requested action'), 'Confirm the queue wiring')
    await user.click(screen.getByRole('button', { name: 'Create handoff' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'create_handoff',
      changed_by: 'operator',
      due_at: undefined,
      expires_at: undefined,
      from_agent_id: 'agent-1',
      handoff_summary: 'Review the next coordination step',
      handoff_type: 'request_review',
      requested_action: 'Confirm the queue wiring',
      taskId: 'task-1',
      to_agent_id: 'agent-2',
    })

    await user.type(screen.getByLabelText('Message body'), 'Operator initiated a follow-up review.')
    await user.click(screen.getByRole('button', { name: 'Post message' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'post_council_message',
      author_agent_id: 'agent-1',
      changed_by: 'operator',
      message_body: 'Operator initiated a follow-up review.',
      message_type: 'status',
      taskId: 'task-1',
    })

    await user.type(screen.getByLabelText('Source ref'), 'operator-note-1')
    await user.type(screen.getByLabelText('Label'), 'Operator note')
    await user.type(screen.getByLabelText('Evidence summary'), 'Linked operator guidance')
    await user.click(screen.getByRole('button', { name: 'Attach evidence' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'attach_evidence',
      changed_by: 'operator',
      evidence_label: 'Operator note',
      evidence_source_kind: 'manual_note',
      evidence_source_ref: 'operator-note-1',
      evidence_summary: 'Linked operator guidance',
      related_file: undefined,
      related_handoff_id: undefined,
      related_memory_query: undefined,
      related_session_id: undefined,
      related_symbol: undefined,
      taskId: 'task-1',
    })

    await user.type(screen.getByLabelText('Title'), 'Track rollout cleanups')
    await user.type(screen.getByLabelText('Description'), 'Capture the remaining operator work')
    await user.click(screen.getByRole('button', { name: 'Create follow-up' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'create_follow_up_task',
      changed_by: 'operator',
      follow_up_description: 'Capture the remaining operator work',
      follow_up_title: 'Track rollout cleanups',
      taskId: 'task-1',
    })
  }, 15000)

  it('forwards explicit review decision and closeout actions from the task detail modal', async () => {
    const user = userEvent.setup()

    currentTaskDetail = structuredClone(mockTaskDetail)
    currentTaskDetail.allowed_actions.push(
      {
        action_id: 'allowed-record-decision',
        agent_id: 'agent-1',
        due_at: null,
        expires_at: null,
        handoff_id: null,
        kind: 'record_decision',
        level: 'needs_attention',
        summary: 'Persist the current-cycle review decision before closeout.',
        target_kind: 'task',
        task_id: 'task-1',
        title: 'Record decision for Add Cap Canopy page',
      },
      {
        action_id: 'allowed-close-task',
        agent_id: 'agent-1',
        due_at: null,
        expires_at: null,
        handoff_id: null,
        kind: 'close_task',
        level: 'needs_attention',
        summary: 'Finalize review closeout and mark the task complete.',
        target_kind: 'task',
        task_id: 'task-1',
        title: 'Close Add Cap Canopy page',
      }
    )

    renderWithProviders(<Canopy />, { route: '/canopy?task=task-1' })

    await user.type(screen.getByLabelText('Decision body'), 'Ship the reviewed task.')
    await user.click(screen.getByRole('button', { name: 'Record decision' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'record_decision',
      author_agent_id: 'agent-1',
      changed_by: 'operator',
      message_body: 'Ship the reviewed task.',
      taskId: 'task-1',
    })

    await user.type(screen.getByLabelText('Closeout summary'), 'Review complete and closed out.')
    await user.click(screen.getByRole('button', { name: 'Close task' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'close_task',
      changed_by: 'operator',
      closure_summary: 'Review complete and closed out.',
      taskId: 'task-1',
    })
  })

  it('shows graph lifecycle actions when the runtime allows reopen and chain close', async () => {
    const user = userEvent.setup()

    currentTaskDetail = structuredClone(mockTaskDetail)
    currentTaskDetail.task.status = 'blocked'
    currentTaskDetail.task.blocked_reason = 'waiting on operator unblock'
    currentTaskDetail.related_tasks = [
      {
        blocked_reason: null,
        created_at: '2026-03-28T12:09:00Z',
        owner_agent_id: 'agent-2',
        priority: 'medium',
        related_task_id: 'task-3',
        relationship_id: 'rel-1',
        relationship_kind: 'follow_up',
        relationship_role: 'follow_up_child',
        severity: 'none',
        status: 'completed',
        title: 'Track rollout cleanups',
        updated_at: '2026-03-28T13:09:00Z',
        verification_state: 'passed',
      },
    ]
    currentTaskDetail.allowed_actions = currentTaskDetail.allowed_actions.filter(
      (action) => action.kind !== 'resolve_dependency' && action.kind !== 'promote_follow_up'
    )
    currentTaskDetail.allowed_actions.push(
      {
        action_id: 'allowed-reopen',
        agent_id: 'agent-1',
        due_at: null,
        expires_at: null,
        handoff_id: null,
        kind: 'reopen_blocked_task_when_unblocked',
        level: 'needs_attention',
        summary: 'Reopen a blocked task after its dependency blockers are cleared.',
        target_kind: 'task',
        task_id: 'task-1',
        title: 'Reopen Add Cap Canopy page',
      },
      {
        action_id: 'allowed-close-chain',
        agent_id: 'agent-1',
        due_at: null,
        expires_at: null,
        handoff_id: null,
        kind: 'close_follow_up_chain',
        level: 'needs_attention',
        summary: 'Detach resolved follow-up tasks from this task chain.',
        target_kind: 'task',
        task_id: 'task-1',
        title: 'Close follow-up chain for Add Cap Canopy page',
      }
    )

    renderWithProviders(<Canopy />, { route: '/canopy?task=task-1' })

    await user.click(screen.getByRole('button', { name: 'Reopen blocked task' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'reopen_blocked_task_when_unblocked',
      changed_by: 'operator',
      note: undefined,
      taskId: 'task-1',
    })

    await user.click(screen.getByRole('button', { name: 'Close follow-up chain' }))
    expect(taskActionMutateMock).toHaveBeenCalledWith({
      action: 'close_follow_up_chain',
      changed_by: 'operator',
      note: undefined,
      taskId: 'task-1',
    })
  })

  it('scopes handoff action controls to the runtime-allowed handoff ids', async () => {
    const user = userEvent.setup()

    currentTaskDetail = structuredClone(mockTaskDetail)
    currentTaskDetail.handoffs = [
      ...currentTaskDetail.handoffs,
      {
        created_at: '2026-03-28T12:12:00Z',
        due_at: '2026-03-28T12:50:00Z',
        expires_at: '2026-03-28T13:10:00Z',
        from_agent_id: 'agent-1',
        handoff_id: 'handoff-2',
        handoff_type: 'request_help',
        requested_action: 'Check the deployment path',
        resolved_at: null,
        status: 'open',
        summary: 'Need deployment help',
        task_id: 'task-1',
        to_agent_id: 'agent-2',
        updated_at: '2026-03-28T12:12:00Z',
      },
    ]
    currentTaskDetail.allowed_actions = currentTaskDetail.allowed_actions.filter(
      (action) => action.target_kind !== 'handoff' || action.handoff_id === 'handoff-1'
    )

    renderWithProviders(<Canopy />, { route: '/canopy?task=task-1' })

    expect(screen.getByText('Need deployment help to agent-2')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Accept handoff' })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Accept handoff' }))
    await waitFor(() =>
      expect(handoffActionMutateMock).toHaveBeenCalledWith({
        acting_agent_id: 'agent-2',
        action: 'accept_handoff',
        changed_by: 'operator',
        handoffId: 'handoff-1',
        note: undefined,
        taskId: 'task-1',
      })
    )
  })

  it('shows a modal-local error state when task detail cannot be loaded', async () => {
    const user = userEvent.setup()
    mockTaskDetailError = new Error('task detail failed')

    renderWithProviders(<Canopy />, { route: '/canopy' })

    const [openTaskButton] = screen.getAllByRole('button', { name: 'Open task detail' })
    await user.click(openTaskButton)

    expect(await screen.findByText('Could not load task detail for the selected Canopy task.')).toBeInTheDocument()
    expect(screen.getAllByText('task detail failed').length).toBeGreaterThan(0)
  })
})
