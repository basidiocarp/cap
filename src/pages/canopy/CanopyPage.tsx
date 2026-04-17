import { Stack, Text, Title } from '@mantine/core'

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

  // Aggregate queue errors
  const failedQueues = queueSnapshots.filter((q) => q.error instanceof Error).map((q) => q.label)
  const hasQueueErrors = failedQueues.length > 0

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
