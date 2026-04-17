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

export function useCanopyQueueSnapshots(project: string | undefined) {
  // Call the hook once for each queue preset.
  // React hook rules apply: these calls happen unconditionally in the same order each render.
  const criticalSnapshot = useCanopySnapshot({ preset: 'critical', project })
  const unacknowledgedSnapshot = useCanopySnapshot({ preset: 'unacknowledged', project })
  const blockedSnapshot = useCanopySnapshot({ preset: 'blocked', project })
  const blockedByDependenciesSnapshot = useCanopySnapshot({ preset: 'blocked_by_dependencies', project })
  const reviewWithGraphPressureSnapshot = useCanopySnapshot({ preset: 'review_with_graph_pressure', project })
  const reviewHandoffFollowThroughSnapshot = useCanopySnapshot({ preset: 'review_handoff_follow_through', project })
  const dueSoonReviewHandoffFollowThroughSnapshot = useCanopySnapshot({
    preset: 'due_soon_review_handoff_follow_through',
    project,
  })
  const overdueReviewHandoffFollowThroughSnapshot = useCanopySnapshot({
    preset: 'overdue_review_handoff_follow_through',
    project,
  })
  const reviewDecisionFollowThroughSnapshot = useCanopySnapshot({ preset: 'review_decision_follow_through', project })
  const dueSoonReviewDecisionFollowThroughSnapshot = useCanopySnapshot({
    preset: 'due_soon_review_decision_follow_through',
    project,
  })
  const overdueReviewDecisionFollowThroughSnapshot = useCanopySnapshot({
    preset: 'overdue_review_decision_follow_through',
    project,
  })
  const reviewAwaitingSupportSnapshot = useCanopySnapshot({ preset: 'review_awaiting_support', project })
  const reviewReadyForDecisionSnapshot = useCanopySnapshot({ preset: 'review_ready_for_decision', project })
  const reviewReadyForCloseoutSnapshot = useCanopySnapshot({ preset: 'review_ready_for_closeout', project })
  const unclaimedSnapshot = useCanopySnapshot({ preset: 'unclaimed', project })
  const assignedAwaitingClaimSnapshot = useCanopySnapshot({ preset: 'assigned_awaiting_claim', project })
  const claimedNotStartedSnapshot = useCanopySnapshot({ preset: 'claimed_not_started', project })
  const inProgressSnapshot = useCanopySnapshot({ preset: 'in_progress', project })
  const stalledSnapshot = useCanopySnapshot({ preset: 'stalled', project })
  const pausedResumableSnapshot = useCanopySnapshot({ preset: 'paused_resumable', project })
  const dueSoonSnapshot = useCanopySnapshot({ preset: 'due_soon', project })
  const dueSoonExecutionSnapshot = useCanopySnapshot({ preset: 'due_soon_execution', project })
  const dueSoonReviewSnapshot = useCanopySnapshot({ preset: 'due_soon_review', project })
  const overdueExecutionSnapshot = useCanopySnapshot({ preset: 'overdue_execution', project })
  const overdueExecutionOwnedSnapshot = useCanopySnapshot({ preset: 'overdue_execution_owned', project })
  const overdueExecutionUnclaimedSnapshot = useCanopySnapshot({ preset: 'overdue_execution_unclaimed', project })
  const overdueReviewSnapshot = useCanopySnapshot({ preset: 'overdue_review', project })
  const handoffsSnapshot = useCanopySnapshot({ preset: 'handoffs', project })
  const awaitingHandoffAcceptanceSnapshot = useCanopySnapshot({ preset: 'awaiting_handoff_acceptance', project })
  const dueSoonHandoffAcceptanceSnapshot = useCanopySnapshot({ preset: 'due_soon_handoff_acceptance', project })
  const overdueHandoffAcceptanceSnapshot = useCanopySnapshot({ preset: 'overdue_handoff_acceptance', project })
  const acceptedHandoffFollowThroughSnapshot = useCanopySnapshot({ preset: 'accepted_handoff_follow_through', project })
  const dueSoonAcceptedHandoffFollowThroughSnapshot = useCanopySnapshot({
    preset: 'due_soon_accepted_handoff_follow_through',
    project,
  })
  const overdueAcceptedHandoffFollowThroughSnapshot = useCanopySnapshot({
    preset: 'overdue_accepted_handoff_follow_through',
    project,
  })
  const followUpChainsSnapshot = useCanopySnapshot({ preset: 'follow_up_chains', project })

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
