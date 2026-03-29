import { Button, Grid } from '@mantine/core'

import type { CanopySnapshot } from '../../lib/api'
import type { CanopySavedView } from './canopy-filters'

interface CanopyQueueSnapshotState {
  error: unknown
  isLoading: boolean
  snapshot?: CanopySnapshot
}

export function CanopyQueuesSection({
  acceptedHandoffFollowThroughQueueSnapshot,
  assignedAwaitingClaimQueueSnapshot,
  awaitingHandoffAcceptanceQueueSnapshot,
  blockedQueueSnapshot,
  claimedNotStartedQueueSnapshot,
  dependencyBlockedQueueSnapshot,
  criticalQueueSnapshot,
  dueSoonQueueSnapshot,
  followUpChainsQueueSnapshot,
  handoffQueueSnapshot,
  inProgressQueueSnapshot,
  openQueuePreset,
  overdueExecutionQueueSnapshot,
  overdueReviewQueueSnapshot,
  pausedResumableQueueSnapshot,
  reviewDecisionFollowThroughQueueSnapshot,
  reviewAwaitingSupportQueueSnapshot,
  reviewReadyForDecisionQueueSnapshot,
  reviewReadyForCloseoutQueueSnapshot,
  reviewHandoffFollowThroughQueueSnapshot,
  reviewWithGraphPressureQueueSnapshot,
  savedView,
  stalledQueueSnapshot,
  unacknowledgedQueueSnapshot,
  unclaimedQueueSnapshot,
}: {
  acceptedHandoffFollowThroughQueueSnapshot: CanopyQueueSnapshotState
  assignedAwaitingClaimQueueSnapshot: CanopyQueueSnapshotState
  awaitingHandoffAcceptanceQueueSnapshot: CanopyQueueSnapshotState
  blockedQueueSnapshot: CanopyQueueSnapshotState
  claimedNotStartedQueueSnapshot: CanopyQueueSnapshotState
  dependencyBlockedQueueSnapshot: CanopyQueueSnapshotState
  criticalQueueSnapshot: CanopyQueueSnapshotState
  dueSoonQueueSnapshot: CanopyQueueSnapshotState
  followUpChainsQueueSnapshot: CanopyQueueSnapshotState
  handoffQueueSnapshot: CanopyQueueSnapshotState
  inProgressQueueSnapshot: CanopyQueueSnapshotState
  openQueuePreset: (preset: CanopySavedView) => void
  overdueExecutionQueueSnapshot: CanopyQueueSnapshotState
  overdueReviewQueueSnapshot: CanopyQueueSnapshotState
  pausedResumableQueueSnapshot: CanopyQueueSnapshotState
  reviewDecisionFollowThroughQueueSnapshot: CanopyQueueSnapshotState
  reviewAwaitingSupportQueueSnapshot: CanopyQueueSnapshotState
  reviewReadyForDecisionQueueSnapshot: CanopyQueueSnapshotState
  reviewReadyForCloseoutQueueSnapshot: CanopyQueueSnapshotState
  reviewHandoffFollowThroughQueueSnapshot: CanopyQueueSnapshotState
  reviewWithGraphPressureQueueSnapshot: CanopyQueueSnapshotState
  savedView: CanopySavedView
  stalledQueueSnapshot: CanopyQueueSnapshotState
  unacknowledgedQueueSnapshot: CanopyQueueSnapshotState
  unclaimedQueueSnapshot: CanopyQueueSnapshotState
}) {
  const renderQueueCount = (state: CanopyQueueSnapshotState) => {
    if (state.error) return 'error'
    if (state.isLoading) return '...'
    return state.snapshot?.tasks.length ?? 0
  }

  return (
    <Grid>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('critical')}
          variant={savedView === 'critical' ? 'filled' : 'light'}
        >
          Critical · {renderQueueCount(criticalQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('unacknowledged')}
          variant={savedView === 'unacknowledged' ? 'filled' : 'light'}
        >
          Unacknowledged · {renderQueueCount(unacknowledgedQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('blocked')}
          variant={savedView === 'blocked' ? 'filled' : 'light'}
        >
          Blocked · {renderQueueCount(blockedQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('blocked_by_dependencies')}
          variant={savedView === 'blocked_by_dependencies' ? 'filled' : 'light'}
        >
          Dependency blocked · {renderQueueCount(dependencyBlockedQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('review_with_graph_pressure')}
          variant={savedView === 'review_with_graph_pressure' ? 'filled' : 'light'}
        >
          Review / graph pressure · {renderQueueCount(reviewWithGraphPressureQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('review_handoff_follow_through')}
          variant={savedView === 'review_handoff_follow_through' ? 'filled' : 'light'}
        >
          Review / handoff follow-through · {renderQueueCount(reviewHandoffFollowThroughQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('review_decision_follow_through')}
          variant={savedView === 'review_decision_follow_through' ? 'filled' : 'light'}
        >
          Review / decision or closeout · {renderQueueCount(reviewDecisionFollowThroughQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('review_awaiting_support')}
          variant={savedView === 'review_awaiting_support' ? 'filled' : 'light'}
        >
          Review / awaiting support · {renderQueueCount(reviewAwaitingSupportQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('review_ready_for_decision')}
          variant={savedView === 'review_ready_for_decision' ? 'filled' : 'light'}
        >
          Review / ready for decision · {renderQueueCount(reviewReadyForDecisionQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('review_ready_for_closeout')}
          variant={savedView === 'review_ready_for_closeout' ? 'filled' : 'light'}
        >
          Review / ready for closeout · {renderQueueCount(reviewReadyForCloseoutQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('unclaimed')}
          variant={savedView === 'unclaimed' ? 'filled' : 'light'}
        >
          Unclaimed · {renderQueueCount(unclaimedQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('assigned_awaiting_claim')}
          variant={savedView === 'assigned_awaiting_claim' ? 'filled' : 'light'}
        >
          Assigned / awaiting claim · {renderQueueCount(assignedAwaitingClaimQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('claimed_not_started')}
          variant={savedView === 'claimed_not_started' ? 'filled' : 'light'}
        >
          Claimed / not started · {renderQueueCount(claimedNotStartedQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('in_progress')}
          variant={savedView === 'in_progress' ? 'filled' : 'light'}
        >
          In progress · {renderQueueCount(inProgressQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('stalled')}
          variant={savedView === 'stalled' ? 'filled' : 'light'}
        >
          Stalled · {renderQueueCount(stalledQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('paused_resumable')}
          variant={savedView === 'paused_resumable' ? 'filled' : 'light'}
        >
          Paused / resumable · {renderQueueCount(pausedResumableQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('due_soon')}
          variant={savedView === 'due_soon' ? 'filled' : 'light'}
        >
          Due soon · {renderQueueCount(dueSoonQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('overdue_execution')}
          variant={savedView === 'overdue_execution' ? 'filled' : 'light'}
        >
          Overdue execution · {renderQueueCount(overdueExecutionQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('overdue_review')}
          variant={savedView === 'overdue_review' ? 'filled' : 'light'}
        >
          Overdue review · {renderQueueCount(overdueReviewQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('handoffs')}
          variant={savedView === 'handoffs' ? 'filled' : 'light'}
        >
          Open handoffs · {renderQueueCount(handoffQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('awaiting_handoff_acceptance')}
          variant={savedView === 'awaiting_handoff_acceptance' ? 'filled' : 'light'}
        >
          Awaiting handoff acceptance · {renderQueueCount(awaitingHandoffAcceptanceQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('accepted_handoff_follow_through')}
          variant={savedView === 'accepted_handoff_follow_through' ? 'filled' : 'light'}
        >
          Accepted handoff follow-through · {renderQueueCount(acceptedHandoffFollowThroughQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('follow_up_chains')}
          variant={savedView === 'follow_up_chains' ? 'filled' : 'light'}
        >
          Follow-up chains · {renderQueueCount(followUpChainsQueueSnapshot)}
        </Button>
      </Grid.Col>
    </Grid>
  )
}
