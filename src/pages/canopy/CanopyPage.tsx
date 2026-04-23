import { Alert, Stack, Text, Title } from '@mantine/core'

import type { DriftSignals } from '../../lib/types'
import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { SectionCard } from '../../components/SectionCard'
import { useCanopyAgents } from '../../lib/queries'
import { CanopyAgentsPanel } from './CanopyAgentsPanel'
import { CanopyFilterPanel } from './CanopyFilterPanel'
import { CanopyQueuesSection } from './CanopyQueuesSection'
import { CanopySavedViewsSection } from './CanopySavedViewsSection'
import { CanopySnapshotBadges, CanopySummaryMetrics, CanopyTaskBoard } from './CanopySnapshotSections'
import { TaskDetailModal } from './TaskDetailModal'
import { useCanopyPageState } from './useCanopyPageState'

function getActiveDriftSignals(signals: DriftSignals): string[] {
  const active: string[] = []

  if (signals.high_correction_rate) {
    active.push('High correction rate — agents are making many self-corrections')
  }

  if (signals.test_failure_streak > 0) {
    active.push(
      `Test failure streak — ${signals.test_failure_streak} consecutive failure${signals.test_failure_streak === 1 ? '' : 's'} with no passing run`
    )
  }

  if (signals.evidence_gap_hours !== null && signals.evidence_gap_hours > 24) {
    active.push(`Evidence gap — no evidence attached in ${Math.round(signals.evidence_gap_hours)} hours`)
  }

  return active
}

export function CanopyPage() {
  const {
    acknowledgedFilter,
    activeProject,
    availableAgents,
    closeTask,
    deadlineSummaryByTaskId,
    detailQuery,
    executionSummaryByTaskId,
    filteredAgentAttention,
    filteredAgents,
    filteredEvidence,
    filteredHandoffAttention,
    filteredHandoffs,
    filteredTaskAttention,
    filteredTasks,
    groupedTasks,
    heartbeatSummaryByTaskId,
    modalOpen,
    openQueuePreset,
    openSavedView,
    openTask,
    operatorActionsByTaskId,
    ownershipByTaskId,
    priorityFilter,
    queueSnapshots,
    relationshipSummaryByTaskId,
    savedView,
    searchQuery,
    slaSummaryByTaskId,
    severityFilter,
    snapshot,
    snapshotSlaSummary,
    snapshotQuery,
    sortMode,
    statusFilter,
    taskAttentionById,
    updateSearchParams,
  } = useCanopyPageState()

  const agentsQuery = useCanopyAgents(activeProject ?? undefined)

  if (snapshotQuery.isLoading) {
    return <PageLoader />
  }

  // Check for active drift signals
  const activeDriftSignals = snapshot?.drift_signals ? getActiveDriftSignals(snapshot.drift_signals) : []

  // Aggregate queue errors
  const failedQueues = queueSnapshots.filter((q) => q.error instanceof Error).map((q) => q.label)
  const hasQueueErrors = failedQueues.length > 0

  // Only show the empty state when no filters are active and the snapshot has loaded with no tasks
  const filtersAreInactive =
    !searchQuery &&
    statusFilter === 'all' &&
    savedView === 'default' &&
    priorityFilter === 'all' &&
    severityFilter === 'all' &&
    acknowledgedFilter === 'all'
  const showEmptyState = !snapshotQuery.isLoading && !snapshotQuery.error && filteredTasks.length === 0 && filtersAreInactive

  return (
    <Stack>
      <Title order={2}>Canopy</Title>

      <ErrorAlert error={snapshotQuery.error} />
      <ErrorAlert error={detailQuery.error} />
      {hasQueueErrors && (
        <ErrorAlert
          error={new Error(failedQueues.join(', '))}
          title={`${failedQueues.length} queue${failedQueues.length === 1 ? '' : 's'} unavailable`}
        />
      )}

      {activeDriftSignals.length > 0 && (
        <Alert
          color='yellow'
          title='Drift detected'
        >
          <Stack gap='xs'>
            {activeDriftSignals.map((signal) => (
              <Text
                key={signal}
                size='sm'
              >
                {signal}
              </Text>
            ))}
          </Stack>
        </Alert>
      )}

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
          openQueuePreset={openQueuePreset}
          queueSnapshots={queueSnapshots}
          savedView={savedView}
        />
      </SectionCard>

      {agentsQuery.data && agentsQuery.data.length > 0 && (
        <SectionCard title='Active agents'>
          <CanopyAgentsPanel agents={agentsQuery.data} />
        </SectionCard>
      )}

      <CanopySummaryMetrics
        filteredAgents={filteredAgents}
        filteredHandoffs={filteredHandoffs}
        filteredTaskAttention={filteredTaskAttention}
        filteredTasks={filteredTasks}
        snapshotSlaSummary={snapshotSlaSummary}
      />

      <SectionCard title='Operator Snapshot'>
        <CanopySnapshotBadges
          filteredAgentAttention={filteredAgentAttention}
          filteredEvidence={filteredEvidence}
          filteredHandoffAttention={filteredHandoffAttention}
          filteredTaskAttention={filteredTaskAttention}
          snapshotSlaSummary={snapshotSlaSummary}
        />
      </SectionCard>

      {showEmptyState && (
        <EmptyState mt='md'>No tasks yet. Tasks appear here once Canopy records coordination activity for this project.</EmptyState>
      )}

      <CanopyTaskBoard
        deadlineSummaryByTaskId={deadlineSummaryByTaskId}
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
        slaSummaryByTaskId={slaSummaryByTaskId}
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
