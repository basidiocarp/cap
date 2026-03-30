import { Badge, Grid, Group, Stack, Text } from '@mantine/core'

import type {
  CanopyAgentAttention,
  CanopyAgentRegistration,
  CanopyEvidenceRef,
  CanopyHandoff,
  CanopyHandoffAttention,
  CanopyOperatorAction,
  CanopySnapshotSlaSummary,
  CanopyTask,
  CanopyTaskAttention,
  CanopyTaskDeadlineSummary,
  CanopyTaskExecutionSummary,
  CanopyTaskHeartbeatSummary,
  CanopyTaskOwnershipSummary,
  CanopyTaskRelationshipSummary,
  CanopyTaskSlaSummary,
  CanopyTaskStatus,
} from '../../lib/api'
import { EmptyState } from '../../components/EmptyState'
import { SectionCard } from '../../components/SectionCard'
import { breachSeverityColor, formatSlaAge, matchesActiveTask } from './canopy-formatters'
import { TaskCard } from './TaskCard'

export function CanopySummaryMetrics({
  filteredAgents,
  filteredHandoffs,
  snapshotSlaSummary,
  filteredTaskAttention,
  filteredTasks,
}: {
  filteredAgents: CanopyAgentRegistration[]
  filteredHandoffs: CanopyHandoff[]
  snapshotSlaSummary?: CanopySnapshotSlaSummary
  filteredTaskAttention: CanopyTaskAttention[]
  filteredTasks: CanopyTask[]
}) {
  return (
    <Grid>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <SectionCard title='Active Agents'>
          <Text size='xl'>{filteredAgents.length}</Text>
        </SectionCard>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <SectionCard title='Active Tasks'>
          <Text size='xl'>{filteredTasks.filter((task) => matchesActiveTask(task.status)).length}</Text>
        </SectionCard>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <SectionCard title='Needs Attention'>
          <Text size='xl'>{filteredTaskAttention.filter((attention) => attention.level !== 'normal').length}</Text>
        </SectionCard>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <SectionCard title='Open Handoffs'>
          <Text size='xl'>{filteredHandoffs.filter((handoff) => handoff.status === 'open').length}</Text>
        </SectionCard>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <SectionCard title='Overdue'>
          <Text size='xl'>{snapshotSlaSummary?.overdue_count ?? 0}</Text>
          <Text
            c='dimmed'
            size='sm'
          >
            {snapshotSlaSummary?.oldest_overdue_seconds
              ? `Oldest overdue ${formatSlaAge(snapshotSlaSummary.oldest_overdue_seconds)}`
              : 'No overdue SLA pressure'}
          </Text>
        </SectionCard>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <SectionCard title='Due Soon'>
          <Text size='xl'>{snapshotSlaSummary?.due_soon_count ?? 0}</Text>
          <Text
            c='dimmed'
            size='sm'
          >
            {snapshotSlaSummary ? `Breach severity ${snapshotSlaSummary.breach_severity}` : 'No SLA summary'}
          </Text>
        </SectionCard>
      </Grid.Col>
    </Grid>
  )
}

export function CanopySnapshotBadges({
  filteredAgentAttention,
  filteredEvidence,
  filteredHandoffAttention,
  snapshotSlaSummary,
  filteredTaskAttention,
}: {
  filteredAgentAttention: CanopyAgentAttention[]
  filteredEvidence: CanopyEvidenceRef[]
  filteredHandoffAttention: CanopyHandoffAttention[]
  snapshotSlaSummary?: CanopySnapshotSlaSummary
  filteredTaskAttention: CanopyTaskAttention[]
}) {
  return (
    <Group gap='xs'>
      <Badge
        color='red'
        variant='light'
      >
        {filteredTaskAttention.filter((attention) => attention.level === 'critical').length} critical tasks
      </Badge>
      <Badge
        color='yellow'
        variant='light'
      >
        {filteredTaskAttention.filter((attention) => attention.level !== 'normal').length} need attention
      </Badge>
      <Badge
        color='orange'
        variant='light'
      >
        {filteredAgentAttention.filter((attention) => attention.freshness === 'stale').length} stale agents
      </Badge>
      <Badge
        color='grape'
        variant='light'
      >
        {filteredHandoffAttention.filter((attention) => attention.freshness === 'stale').length} stale handoffs
      </Badge>
      <Badge
        color='teal'
        variant='light'
      >
        {filteredEvidence.length} evidence refs
      </Badge>
      {snapshotSlaSummary ? (
        <Badge
          color={breachSeverityColor(snapshotSlaSummary.breach_severity)}
          variant='light'
        >
          SLA {snapshotSlaSummary.breach_severity}
        </Badge>
      ) : null}
      {snapshotSlaSummary?.oldest_overdue_seconds ? (
        <Badge
          color='red'
          variant='outline'
        >
          oldest overdue {formatSlaAge(snapshotSlaSummary.oldest_overdue_seconds)}
        </Badge>
      ) : null}
    </Group>
  )
}

export function CanopyTaskBoard({
  executionSummaryByTaskId,
  filteredTasks,
  groupedTasks,
  heartbeatSummaryByTaskId,
  deadlineSummaryByTaskId,
  slaSummaryByTaskId,
  onOpenTask,
  operatorActionsByTaskId,
  ownershipByTaskId,
  relationshipSummaryByTaskId,
  renderGroupedByStatus,
  searchQuery,
  statusFilter,
  taskAttentionById,
}: {
  executionSummaryByTaskId: Map<string, CanopyTaskExecutionSummary>
  filteredTasks: CanopyTask[]
  groupedTasks: Array<{ status: CanopyTaskStatus; tasks: CanopyTask[] }>
  heartbeatSummaryByTaskId: Map<string, CanopyTaskHeartbeatSummary>
  deadlineSummaryByTaskId: Map<string, CanopyTaskDeadlineSummary>
  slaSummaryByTaskId: Map<string, CanopyTaskSlaSummary>
  onOpenTask: (taskId: string) => void
  operatorActionsByTaskId: Map<string, CanopyOperatorAction[]>
  ownershipByTaskId: Map<string, CanopyTaskOwnershipSummary>
  relationshipSummaryByTaskId: Map<string, CanopyTaskRelationshipSummary>
  renderGroupedByStatus: boolean
  searchQuery: string
  statusFilter: string
  taskAttentionById: Map<string, CanopyTaskAttention>
}) {
  if (filteredTasks.length === 0) {
    return (
      <SectionCard title='Tasks'>
        <EmptyState>
          {searchQuery || statusFilter !== 'all'
            ? 'No Canopy tasks match the current filters.'
            : 'No Canopy tasks are in scope for the active project yet.'}
        </EmptyState>
      </SectionCard>
    )
  }

  if (!renderGroupedByStatus) {
    return (
      <SectionCard title={`Tasks (${filteredTasks.length})`}>
        <Stack gap='md'>
          {filteredTasks.map((task) => (
            <TaskCard
              actions={operatorActionsByTaskId.get(task.task_id) ?? []}
              attention={taskAttentionById.get(task.task_id)}
              deadlineSummary={deadlineSummaryByTaskId.get(task.task_id)}
              executionSummary={executionSummaryByTaskId.get(task.task_id)}
              heartbeatSummary={heartbeatSummaryByTaskId.get(task.task_id)}
              key={task.task_id}
              onOpen={onOpenTask}
              ownership={ownershipByTaskId.get(task.task_id)}
              relationshipSummary={relationshipSummaryByTaskId.get(task.task_id)}
              slaSummary={slaSummaryByTaskId.get(task.task_id)}
              task={task}
            />
          ))}
        </Stack>
      </SectionCard>
    )
  }

  return (
    <Stack gap='md'>
      {groupedTasks.map((group) => (
        <SectionCard
          key={group.status}
          title={`${group.status.replaceAll('_', ' ')} (${group.tasks.length})`}
        >
          <Stack gap='md'>
            {group.tasks.map((task) => (
              <TaskCard
                actions={operatorActionsByTaskId.get(task.task_id) ?? []}
                attention={taskAttentionById.get(task.task_id)}
                deadlineSummary={deadlineSummaryByTaskId.get(task.task_id)}
                executionSummary={executionSummaryByTaskId.get(task.task_id)}
                heartbeatSummary={heartbeatSummaryByTaskId.get(task.task_id)}
                key={task.task_id}
                onOpen={onOpenTask}
                ownership={ownershipByTaskId.get(task.task_id)}
                relationshipSummary={relationshipSummaryByTaskId.get(task.task_id)}
                slaSummary={slaSummaryByTaskId.get(task.task_id)}
                task={task}
              />
            ))}
          </Stack>
        </SectionCard>
      ))}
    </Stack>
  )
}
