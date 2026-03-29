import { Stack, Text, Title } from '@mantine/core'

import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { SectionCard } from '../../components/SectionCard'
import { CanopyFilterPanel } from './CanopyFilterPanel'
import { CanopyQueuesSection } from './CanopyQueuesSection'
import { CanopySavedViewsSection } from './CanopySavedViewsSection'
import { CanopySnapshotBadges, CanopySummaryMetrics, CanopyTaskBoard } from './CanopySnapshotSections'
import { TaskDetailModal } from './TaskDetailModal'
import { useCanopyPageState } from './useCanopyPageState'

export function CanopyPage() {
  const {
    acknowledgedFilter,
    acceptedHandoffFollowThroughQueueSnapshot,
    activeProject,
    assignedAwaitingClaimQueueSnapshot,
    availableAgents,
    awaitingHandoffAcceptanceQueueSnapshot,
    blockedQueueSnapshot,
    claimedNotStartedQueueSnapshot,
    closeTask,
    criticalQueueSnapshot,
    dependencyBlockedQueueSnapshot,
    detailQuery,
    executionSummaryByTaskId,
    filteredAgentAttention,
    filteredAgents,
    filteredEvidence,
    filteredHandoffAttention,
    filteredHandoffs,
    filteredTaskAttention,
    filteredTasks,
    followUpChainsQueueSnapshot,
    groupedTasks,
    handoffQueueSnapshot,
    heartbeatSummaryByTaskId,
    inProgressQueueSnapshot,
    modalOpen,
    openQueuePreset,
    openSavedView,
    openTask,
    operatorActionsByTaskId,
    ownershipByTaskId,
    pausedResumableQueueSnapshot,
    priorityFilter,
    relationshipSummaryByTaskId,
    savedView,
    searchQuery,
    severityFilter,
    snapshotQuery,
    sortMode,
    stalledQueueSnapshot,
    statusFilter,
    taskAttentionById,
    unacknowledgedQueueSnapshot,
    unclaimedQueueSnapshot,
    updateSearchParams,
  } = useCanopyPageState()

  if (snapshotQuery.isLoading) {
    return <PageLoader />
  }

  return (
    <Stack>
      <Title order={2}>Canopy</Title>

      <ErrorAlert error={snapshotQuery.error} />
      <ErrorAlert error={detailQuery.error} />
      <ErrorAlert
        error={criticalQueueSnapshot.error instanceof Error ? criticalQueueSnapshot.error : undefined}
        title='Critical queue unavailable'
      />
      <ErrorAlert
        error={unacknowledgedQueueSnapshot.error instanceof Error ? unacknowledgedQueueSnapshot.error : undefined}
        title='Unacknowledged queue unavailable'
      />
      <ErrorAlert
        error={blockedQueueSnapshot.error instanceof Error ? blockedQueueSnapshot.error : undefined}
        title='Blocked queue unavailable'
      />
      <ErrorAlert
        error={dependencyBlockedQueueSnapshot.error instanceof Error ? dependencyBlockedQueueSnapshot.error : undefined}
        title='Dependency queue unavailable'
      />
      <ErrorAlert
        error={handoffQueueSnapshot.error instanceof Error ? handoffQueueSnapshot.error : undefined}
        title='Handoff queue unavailable'
      />
      <ErrorAlert
        error={unclaimedQueueSnapshot.error instanceof Error ? unclaimedQueueSnapshot.error : undefined}
        title='Unclaimed queue unavailable'
      />
      <ErrorAlert
        error={assignedAwaitingClaimQueueSnapshot.error instanceof Error ? assignedAwaitingClaimQueueSnapshot.error : undefined}
        title='Assigned awaiting claim queue unavailable'
      />
      <ErrorAlert
        error={claimedNotStartedQueueSnapshot.error instanceof Error ? claimedNotStartedQueueSnapshot.error : undefined}
        title='Claimed not started queue unavailable'
      />
      <ErrorAlert
        error={inProgressQueueSnapshot.error instanceof Error ? inProgressQueueSnapshot.error : undefined}
        title='In progress queue unavailable'
      />
      <ErrorAlert
        error={stalledQueueSnapshot.error instanceof Error ? stalledQueueSnapshot.error : undefined}
        title='Stalled queue unavailable'
      />
      <ErrorAlert
        error={pausedResumableQueueSnapshot.error instanceof Error ? pausedResumableQueueSnapshot.error : undefined}
        title='Paused resumable queue unavailable'
      />
      <ErrorAlert
        error={awaitingHandoffAcceptanceQueueSnapshot.error instanceof Error ? awaitingHandoffAcceptanceQueueSnapshot.error : undefined}
        title='Awaiting handoff acceptance queue unavailable'
      />
      <ErrorAlert
        error={
          acceptedHandoffFollowThroughQueueSnapshot.error instanceof Error ? acceptedHandoffFollowThroughQueueSnapshot.error : undefined
        }
        title='Accepted handoff follow-through queue unavailable'
      />
      <ErrorAlert
        error={followUpChainsQueueSnapshot.error instanceof Error ? followUpChainsQueueSnapshot.error : undefined}
        title='Follow-up queue unavailable'
      />

      <Text
        c='dimmed'
        size='sm'
      >
        Showing Canopy coordination state{activeProject ? ` for ${activeProject}` : ''}.
      </Text>

      <SectionCard title='Task filters'>
        <CanopyFilterPanel
          acknowledgedFilter={acknowledgedFilter}
          priorityFilter={priorityFilter}
          searchQuery={searchQuery}
          severityFilter={severityFilter}
          sortMode={sortMode}
          statusFilter={statusFilter}
          updateSearchParams={updateSearchParams}
        />
      </SectionCard>

      <SectionCard title='Saved views'>
        <CanopySavedViewsSection
          openSavedView={openSavedView}
          savedView={savedView}
          sortMode={sortMode}
        />
      </SectionCard>

      <SectionCard title='Operator queues'>
        <CanopyQueuesSection
          acceptedHandoffFollowThroughQueueSnapshot={acceptedHandoffFollowThroughQueueSnapshot}
          assignedAwaitingClaimQueueSnapshot={assignedAwaitingClaimQueueSnapshot}
          awaitingHandoffAcceptanceQueueSnapshot={awaitingHandoffAcceptanceQueueSnapshot}
          blockedQueueSnapshot={blockedQueueSnapshot}
          claimedNotStartedQueueSnapshot={claimedNotStartedQueueSnapshot}
          criticalQueueSnapshot={criticalQueueSnapshot}
          dependencyBlockedQueueSnapshot={dependencyBlockedQueueSnapshot}
          followUpChainsQueueSnapshot={followUpChainsQueueSnapshot}
          handoffQueueSnapshot={handoffQueueSnapshot}
          inProgressQueueSnapshot={inProgressQueueSnapshot}
          openQueuePreset={openQueuePreset}
          pausedResumableQueueSnapshot={pausedResumableQueueSnapshot}
          savedView={savedView}
          stalledQueueSnapshot={stalledQueueSnapshot}
          unacknowledgedQueueSnapshot={unacknowledgedQueueSnapshot}
          unclaimedQueueSnapshot={unclaimedQueueSnapshot}
        />
      </SectionCard>

      <CanopySummaryMetrics
        filteredAgents={filteredAgents}
        filteredHandoffs={filteredHandoffs}
        filteredTaskAttention={filteredTaskAttention}
        filteredTasks={filteredTasks}
      />

      <SectionCard title='Operator Snapshot'>
        <CanopySnapshotBadges
          filteredAgentAttention={filteredAgentAttention}
          filteredEvidence={filteredEvidence}
          filteredHandoffAttention={filteredHandoffAttention}
          filteredTaskAttention={filteredTaskAttention}
        />
      </SectionCard>

      <CanopyTaskBoard
        executionSummaryByTaskId={executionSummaryByTaskId}
        filteredTasks={filteredTasks}
        groupedTasks={groupedTasks}
        heartbeatSummaryByTaskId={heartbeatSummaryByTaskId}
        onOpenTask={openTask}
        operatorActionsByTaskId={operatorActionsByTaskId}
        ownershipByTaskId={ownershipByTaskId}
        relationshipSummaryByTaskId={relationshipSummaryByTaskId}
        renderGroupedByStatus={sortMode === 'status'}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        taskAttentionById={taskAttentionById}
      />

      <TaskDetailModal
        agents={availableAgents}
        detail={detailQuery.data}
        error={detailQuery.error}
        onClose={closeTask}
        onOpenTask={openTask}
        opened={modalOpen}
      />
    </Stack>
  )
}
