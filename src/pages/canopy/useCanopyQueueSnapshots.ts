import { useCanopySnapshot } from '../../lib/queries'
import { CANOPY_QUEUES } from './canopy-queues'

export interface CanopyQueueSnapshotState {
  error: unknown
  isLoading: boolean
  snapshot: ReturnType<typeof useCanopySnapshot>['data']
}

export interface CanopyQueueSnapshotWithDefinition extends CanopyQueueSnapshotState {
  label: string
  preset: string
}

// Accepts an `enabled` flag so the caller can defer all 35 queue queries until
// the primary snapshot has loaded. Pass `enabled: false` on first render to cut
// simultaneous query fan-out from ~37 down to 1-3, then flip to `true` once the
// primary data is available. Badge counts remain correct because the queries fire
// before the queue section is interactive.
//
// When `enabled` is true (the default), no `enabled` key is included in the
// options object so callers that inspect call arguments see the same shape as
// the original eager-loading behaviour.
export function useCanopyQueueSnapshots(project: string | undefined, enabled = true) {
  // Spread `enabled: false` only when gating is active; omit the key entirely
  // when enabled so the call shape is identical to the original eager calls.
  const gate = enabled ? {} : { enabled: false as const }

  // Call the hook once for each queue preset.
  // React hook rules apply: these calls happen unconditionally in the same order each render.
  const criticalSnapshot = useCanopySnapshot({ ...gate, preset: 'critical', project })
  const unacknowledgedSnapshot = useCanopySnapshot({ ...gate, preset: 'unacknowledged', project })
  const blockedSnapshot = useCanopySnapshot({ ...gate, preset: 'blocked', project })
  const blockedByDependenciesSnapshot = useCanopySnapshot({ ...gate, preset: 'blocked_by_dependencies', project })
  const reviewWithGraphPressureSnapshot = useCanopySnapshot({ ...gate, preset: 'review_with_graph_pressure', project })
  const reviewHandoffFollowThroughSnapshot = useCanopySnapshot({ ...gate, preset: 'review_handoff_follow_through', project })
  const dueSoonReviewHandoffFollowThroughSnapshot = useCanopySnapshot({
    ...gate,
    preset: 'due_soon_review_handoff_follow_through',
    project,
  })
  const overdueReviewHandoffFollowThroughSnapshot = useCanopySnapshot({
    ...gate,
    preset: 'overdue_review_handoff_follow_through',
    project,
  })
  const reviewDecisionFollowThroughSnapshot = useCanopySnapshot({ ...gate, preset: 'review_decision_follow_through', project })
  const dueSoonReviewDecisionFollowThroughSnapshot = useCanopySnapshot({
    ...gate,
    preset: 'due_soon_review_decision_follow_through',
    project,
  })
  const overdueReviewDecisionFollowThroughSnapshot = useCanopySnapshot({
    ...gate,
    preset: 'overdue_review_decision_follow_through',
    project,
  })
  const reviewAwaitingSupportSnapshot = useCanopySnapshot({ ...gate, preset: 'review_awaiting_support', project })
  const reviewReadyForDecisionSnapshot = useCanopySnapshot({ ...gate, preset: 'review_ready_for_decision', project })
  const reviewReadyForCloseoutSnapshot = useCanopySnapshot({ ...gate, preset: 'review_ready_for_closeout', project })
  const unclaimedSnapshot = useCanopySnapshot({ ...gate, preset: 'unclaimed', project })
  const assignedAwaitingClaimSnapshot = useCanopySnapshot({ ...gate, preset: 'assigned_awaiting_claim', project })
  const claimedNotStartedSnapshot = useCanopySnapshot({ ...gate, preset: 'claimed_not_started', project })
  const inProgressSnapshot = useCanopySnapshot({ ...gate, preset: 'in_progress', project })
  const stalledSnapshot = useCanopySnapshot({ ...gate, preset: 'stalled', project })
  const pausedResumableSnapshot = useCanopySnapshot({ ...gate, preset: 'paused_resumable', project })
  const dueSoonSnapshot = useCanopySnapshot({ ...gate, preset: 'due_soon', project })
  const dueSoonExecutionSnapshot = useCanopySnapshot({ ...gate, preset: 'due_soon_execution', project })
  const dueSoonReviewSnapshot = useCanopySnapshot({ ...gate, preset: 'due_soon_review', project })
  const overdueExecutionSnapshot = useCanopySnapshot({ ...gate, preset: 'overdue_execution', project })
  const overdueExecutionOwnedSnapshot = useCanopySnapshot({ ...gate, preset: 'overdue_execution_owned', project })
  const overdueExecutionUnclaimedSnapshot = useCanopySnapshot({ ...gate, preset: 'overdue_execution_unclaimed', project })
  const overdueReviewSnapshot = useCanopySnapshot({ ...gate, preset: 'overdue_review', project })
  const handoffsSnapshot = useCanopySnapshot({ ...gate, preset: 'handoffs', project })
  const awaitingHandoffAcceptanceSnapshot = useCanopySnapshot({ ...gate, preset: 'awaiting_handoff_acceptance', project })
  const dueSoonHandoffAcceptanceSnapshot = useCanopySnapshot({ ...gate, preset: 'due_soon_handoff_acceptance', project })
  const overdueHandoffAcceptanceSnapshot = useCanopySnapshot({ ...gate, preset: 'overdue_handoff_acceptance', project })
  const acceptedHandoffFollowThroughSnapshot = useCanopySnapshot({ ...gate, preset: 'accepted_handoff_follow_through', project })
  const dueSoonAcceptedHandoffFollowThroughSnapshot = useCanopySnapshot({
    ...gate,
    preset: 'due_soon_accepted_handoff_follow_through',
    project,
  })
  const overdueAcceptedHandoffFollowThroughSnapshot = useCanopySnapshot({
    ...gate,
    preset: 'overdue_accepted_handoff_follow_through',
    project,
  })
  const followUpChainsSnapshot = useCanopySnapshot({ ...gate, preset: 'follow_up_chains', project })

  // Collect all snapshots in order to match CANOPY_QUEUES
  const snapshots = [
    criticalSnapshot,
    unacknowledgedSnapshot,
    blockedSnapshot,
    blockedByDependenciesSnapshot,
    reviewWithGraphPressureSnapshot,
    reviewHandoffFollowThroughSnapshot,
    dueSoonReviewHandoffFollowThroughSnapshot,
    overdueReviewHandoffFollowThroughSnapshot,
    reviewDecisionFollowThroughSnapshot,
    dueSoonReviewDecisionFollowThroughSnapshot,
    overdueReviewDecisionFollowThroughSnapshot,
    reviewAwaitingSupportSnapshot,
    reviewReadyForDecisionSnapshot,
    reviewReadyForCloseoutSnapshot,
    unclaimedSnapshot,
    assignedAwaitingClaimSnapshot,
    claimedNotStartedSnapshot,
    inProgressSnapshot,
    stalledSnapshot,
    pausedResumableSnapshot,
    dueSoonSnapshot,
    dueSoonExecutionSnapshot,
    dueSoonReviewSnapshot,
    overdueExecutionSnapshot,
    overdueExecutionOwnedSnapshot,
    overdueExecutionUnclaimedSnapshot,
    overdueReviewSnapshot,
    handoffsSnapshot,
    awaitingHandoffAcceptanceSnapshot,
    dueSoonHandoffAcceptanceSnapshot,
    overdueHandoffAcceptanceSnapshot,
    acceptedHandoffFollowThroughSnapshot,
    dueSoonAcceptedHandoffFollowThroughSnapshot,
    overdueAcceptedHandoffFollowThroughSnapshot,
    followUpChainsSnapshot,
  ]

  // Zip snapshots with queue definitions
  return CANOPY_QUEUES.map((queue, index) => ({
    error: snapshots[index]?.error,
    isLoading: snapshots[index]?.isLoading ?? false,
    label: queue.label,
    preset: queue.preset,
    snapshot: snapshots[index]?.data,
  }))
}
