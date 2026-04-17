import type { CanopySnapshotPreset } from '../../lib/types/canopy'

export interface CanopyQueueDefinition {
  preset: CanopySnapshotPreset
  label: string
}

export const CANOPY_QUEUES: CanopyQueueDefinition[] = [
  { label: 'Critical', preset: 'critical' },
  { label: 'Unacknowledged', preset: 'unacknowledged' },
  { label: 'Blocked', preset: 'blocked' },
  { label: 'Dependency blocked', preset: 'blocked_by_dependencies' },
  { label: 'Review / graph pressure', preset: 'review_with_graph_pressure' },
  { label: 'Review / handoff follow-through', preset: 'review_handoff_follow_through' },
  { label: 'Review / handoff due soon', preset: 'due_soon_review_handoff_follow_through' },
  { label: 'Review / handoff overdue', preset: 'overdue_review_handoff_follow_through' },
  { label: 'Review / decision or closeout', preset: 'review_decision_follow_through' },
  { label: 'Review / decision due soon', preset: 'due_soon_review_decision_follow_through' },
  { label: 'Review / decision overdue', preset: 'overdue_review_decision_follow_through' },
  { label: 'Review / awaiting support', preset: 'review_awaiting_support' },
  { label: 'Review / ready for decision', preset: 'review_ready_for_decision' },
  { label: 'Review / ready for closeout', preset: 'review_ready_for_closeout' },
  { label: 'Unclaimed', preset: 'unclaimed' },
  { label: 'Assigned / awaiting claim', preset: 'assigned_awaiting_claim' },
  { label: 'Claimed / not started', preset: 'claimed_not_started' },
  { label: 'In progress', preset: 'in_progress' },
  { label: 'Stalled', preset: 'stalled' },
  { label: 'Paused / resumable', preset: 'paused_resumable' },
  { label: 'Due soon', preset: 'due_soon' },
  { label: 'Due soon / execution', preset: 'due_soon_execution' },
  { label: 'Due soon / review', preset: 'due_soon_review' },
  { label: 'Overdue execution', preset: 'overdue_execution' },
  { label: 'Overdue execution / owned', preset: 'overdue_execution_owned' },
  { label: 'Overdue execution / unclaimed', preset: 'overdue_execution_unclaimed' },
  { label: 'Overdue review', preset: 'overdue_review' },
  { label: 'Open handoffs', preset: 'handoffs' },
  { label: 'Awaiting handoff acceptance', preset: 'awaiting_handoff_acceptance' },
  { label: 'Handoff acceptance / due soon', preset: 'due_soon_handoff_acceptance' },
  { label: 'Handoff acceptance / overdue', preset: 'overdue_handoff_acceptance' },
  { label: 'Accepted handoff follow-through', preset: 'accepted_handoff_follow_through' },
  { label: 'Accepted handoff / due soon', preset: 'due_soon_accepted_handoff_follow_through' },
  { label: 'Accepted handoff / overdue', preset: 'overdue_accepted_handoff_follow_through' },
  { label: 'Follow-up chains', preset: 'follow_up_chains' },
]
