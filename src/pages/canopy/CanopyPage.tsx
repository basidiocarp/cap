import { Badge, Button, Grid, Group, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { CanopySavedView } from './canopy-filters'
import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { SectionCard } from '../../components/SectionCard'
import { useCanopySnapshot, useCanopyTaskDetail, useProjectContextController } from '../../lib/queries'
import {
  ACK_FILTER_OPTIONS,
  filterCanopyTasks,
  groupOperatorActionsByTask,
  groupTasksByStatus,
  PRIORITY_FILTER_OPTIONS,
  resolveCanopyViewState,
  SAVED_VIEW_OPTIONS,
  SEVERITY_FILTER_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from './canopy-filters'
import { matchesActiveTask } from './canopy-formatters'
import { TaskCard } from './TaskCard'
import { TaskDetailModal } from './TaskDetailModal'

export function CanopyPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { acknowledgedFilter, priorityFilter, savedView, searchQuery, selectedTaskId, severityFilter, sortMode, statusFilter } =
    resolveCanopyViewState(searchParams)
  const modalOpen = Boolean(selectedTaskId)
  const { data: project } = useProjectContextController()
  const activeProject = project?.active ?? null

  const criticalQueueSnapshotQuery = useCanopySnapshot({
    preset: 'critical',
    project: activeProject ?? undefined,
  })
  const unacknowledgedQueueSnapshotQuery = useCanopySnapshot({
    preset: 'unacknowledged',
    project: activeProject ?? undefined,
  })
  const blockedQueueSnapshotQuery = useCanopySnapshot({
    preset: 'blocked',
    project: activeProject ?? undefined,
  })
  const handoffQueueSnapshotQuery = useCanopySnapshot({
    preset: 'handoffs',
    project: activeProject ?? undefined,
  })
  const snapshotQuery = useCanopySnapshot({
    acknowledged: acknowledgedFilter === 'all' ? undefined : acknowledgedFilter,
    preset: savedView,
    priorityAtLeast: priorityFilter === 'all' ? undefined : priorityFilter,
    project: activeProject ?? undefined,
    severityAtLeast: severityFilter === 'all' ? undefined : severityFilter,
    sort: sortMode,
  })
  const detailQuery = useCanopyTaskDetail(selectedTaskId)
  const snapshot = snapshotQuery.data
  const criticalQueueSnapshot = criticalQueueSnapshotQuery.data
  const unacknowledgedQueueSnapshot = unacknowledgedQueueSnapshotQuery.data
  const blockedQueueSnapshot = blockedQueueSnapshotQuery.data
  const handoffQueueSnapshot = handoffQueueSnapshotQuery.data

  const taskAttentionById = useMemo(
    () => new Map(snapshot?.task_attention.map((attention) => [attention.task_id, attention]) ?? []),
    [snapshot?.task_attention]
  )
  const ownershipByTaskId = useMemo(
    () => new Map(snapshot?.ownership.map((ownership) => [ownership.task_id, ownership]) ?? []),
    [snapshot?.ownership]
  )
  const heartbeatSummaryByTaskId = useMemo(
    () => new Map(snapshot?.task_heartbeat_summaries.map((summary) => [summary.task_id, summary]) ?? []),
    [snapshot?.task_heartbeat_summaries]
  )
  const operatorActionsByTaskId = useMemo(() => groupOperatorActionsByTask(snapshot?.operator_actions), [snapshot?.operator_actions])
  const filteredTasks = useMemo(() => filterCanopyTasks(snapshot, searchQuery, statusFilter), [searchQuery, snapshot, statusFilter])
  const filteredTaskIds = useMemo(() => new Set(filteredTasks.map((task) => task.task_id)), [filteredTasks])
  const filteredOwnerAgentIds = useMemo(() => new Set(filteredTasks.map((task) => task.owner_agent_id).filter(Boolean)), [filteredTasks])
  const filteredAgents = useMemo(() => {
    if (!snapshot) return []
    return snapshot.agents.filter((agent) => agent.current_task_id && filteredTaskIds.has(agent.current_task_id))
  }, [filteredTaskIds, snapshot])
  const filteredAgentIds = useMemo(() => new Set(filteredAgents.map((agent) => agent.agent_id)), [filteredAgents])
  const filteredTaskAttention = useMemo(
    () => snapshot?.task_attention.filter((attention) => filteredTaskIds.has(attention.task_id)) ?? [],
    [filteredTaskIds, snapshot]
  )
  const filteredAgentAttention = useMemo(
    () =>
      snapshot?.agent_attention.filter(
        (attention) =>
          filteredAgentIds.has(attention.agent_id) ||
          filteredOwnerAgentIds.has(attention.agent_id) ||
          (attention.current_task_id ? filteredTaskIds.has(attention.current_task_id) : false)
      ) ?? [],
    [filteredAgentIds, filteredOwnerAgentIds, filteredTaskIds, snapshot]
  )
  const filteredHandoffs = useMemo(
    () => snapshot?.handoffs.filter((handoff) => filteredTaskIds.has(handoff.task_id)) ?? [],
    [filteredTaskIds, snapshot]
  )
  const filteredHandoffIds = useMemo(() => new Set(filteredHandoffs.map((handoff) => handoff.handoff_id)), [filteredHandoffs])
  const filteredHandoffAttention = useMemo(
    () => snapshot?.handoff_attention.filter((attention) => filteredHandoffIds.has(attention.handoff_id)) ?? [],
    [filteredHandoffIds, snapshot]
  )
  const filteredEvidence = useMemo(
    () => snapshot?.evidence.filter((item) => filteredTaskIds.has(item.task_id)) ?? [],
    [filteredTaskIds, snapshot]
  )
  const renderGroupedByStatus = sortMode === 'status'
  const groupedTasks = useMemo(() => groupTasksByStatus(filteredTasks), [filteredTasks])

  const updateSearchParams = (
    updates: {
      ack?: string | null
      preset?: string | null
      priority?: string | null
      q?: string | null
      severity?: string | null
      sort?: string | null
      status?: string | null
      task?: string | null
    },
    options?: { replace?: boolean }
  ) => {
    const next = new URLSearchParams(searchParams)

    if ('preset' in updates) {
      next.delete('view')
    }

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === 'all' || (key === 'preset' && value === 'default')) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }

    setSearchParams(next, { replace: options?.replace ?? true })
  }

  const openTask = (taskId: string) => {
    updateSearchParams({ task: taskId }, { replace: false })
  }

  const closeTask = () => {
    updateSearchParams({ task: null }, { replace: false })
  }

  const openQueuePreset = (preset: CanopySavedView) => {
    updateSearchParams({
      ack: null,
      preset,
      priority: null,
      q: null,
      severity: null,
      sort: null,
      status: null,
      task: null,
    })
  }

  if (snapshotQuery.isLoading) {
    return <PageLoader />
  }

  return (
    <Stack>
      <Title order={2}>Canopy</Title>

      <ErrorAlert error={snapshotQuery.error} />
      <ErrorAlert error={detailQuery.error} />

      <Text
        c='dimmed'
        size='sm'
      >
        Showing Canopy coordination state{activeProject ? ` for ${activeProject}` : ''}.
      </Text>

      <SectionCard title='Task filters'>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label='Search tasks'
              onChange={(event) => updateSearchParams({ q: event.currentTarget.value, task: null })}
              placeholder='Filter by title, description, task id, or owner'
              value={searchQuery}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              data={STATUS_FILTER_OPTIONS}
              label='Status'
              onChange={(value) => updateSearchParams({ status: value ?? 'all', task: null })}
              value={statusFilter}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              data={SORT_OPTIONS}
              label='Sort'
              onChange={(value) => updateSearchParams({ sort: value ?? 'status', task: null })}
              value={sortMode}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              data={PRIORITY_FILTER_OPTIONS}
              label='Priority threshold'
              onChange={(value) => updateSearchParams({ priority: value ?? 'all', task: null })}
              value={priorityFilter}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              data={SEVERITY_FILTER_OPTIONS}
              label='Severity threshold'
              onChange={(value) => updateSearchParams({ severity: value ?? 'all', task: null })}
              value={severityFilter}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              data={ACK_FILTER_OPTIONS}
              label='Acknowledgment'
              onChange={(value) => updateSearchParams({ ack: value ?? 'all', task: null })}
              value={acknowledgedFilter}
            />
          </Grid.Col>
        </Grid>
      </SectionCard>

      <SectionCard title='Saved views'>
        <Stack gap='sm'>
          <Text
            c='dimmed'
            size='sm'
          >
            Switch the board between common operator slices without rebuilding filters by hand.
          </Text>
          <Group gap='xs'>
            {SAVED_VIEW_OPTIONS.map((view) => (
              <Button
                key={view.value}
                onClick={() => updateSearchParams({ preset: view.value, task: null })}
                size='xs'
                variant={savedView === view.value ? 'filled' : 'light'}
              >
                {view.label}
              </Button>
            ))}
          </Group>
          <Text
            c='dimmed'
            size='xs'
          >
            {SAVED_VIEW_OPTIONS.find((view) => view.value === savedView)?.description}. Runtime sort: {sortMode.replaceAll('_', ' ')}.
          </Text>
        </Stack>
      </SectionCard>

      <SectionCard title='Operator queues'>
        <Grid>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Button
              fullWidth
              onClick={() => openQueuePreset('critical')}
              variant={savedView === 'critical' ? 'filled' : 'light'}
            >
              Critical
              {' · '}
              {criticalQueueSnapshot?.tasks.length ?? 0}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Button
              fullWidth
              onClick={() => openQueuePreset('unacknowledged')}
              variant={savedView === 'unacknowledged' ? 'filled' : 'light'}
            >
              Unacknowledged
              {' · '}
              {unacknowledgedQueueSnapshot?.tasks.length ?? 0}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Button
              fullWidth
              onClick={() => openQueuePreset('blocked')}
              variant={savedView === 'blocked' ? 'filled' : 'light'}
            >
              Blocked
              {' · '}
              {blockedQueueSnapshot?.tasks.length ?? 0}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Button
              fullWidth
              onClick={() => openQueuePreset('handoffs')}
              variant={savedView === 'handoffs' ? 'filled' : 'light'}
            >
              Open handoffs
              {' · '}
              {handoffQueueSnapshot?.tasks.length ?? 0}
            </Button>
          </Grid.Col>
        </Grid>
      </SectionCard>

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
      </Grid>

      <SectionCard title='Operator Snapshot'>
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
        </Group>
      </SectionCard>

      {filteredTasks.length === 0 ? (
        <SectionCard title='Tasks'>
          <EmptyState>
            {searchQuery || statusFilter !== 'all'
              ? 'No Canopy tasks match the current filters.'
              : 'No Canopy tasks are in scope for the active project yet.'}
          </EmptyState>
        </SectionCard>
      ) : !renderGroupedByStatus ? (
        <SectionCard title={`Tasks (${filteredTasks.length})`}>
          <Stack gap='md'>
            {filteredTasks.map((task) => (
              <TaskCard
                actions={operatorActionsByTaskId.get(task.task_id) ?? []}
                attention={taskAttentionById.get(task.task_id)}
                heartbeatSummary={heartbeatSummaryByTaskId.get(task.task_id)}
                key={task.task_id}
                onOpen={openTask}
                ownership={ownershipByTaskId.get(task.task_id)}
                task={task}
              />
            ))}
          </Stack>
        </SectionCard>
      ) : (
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
                    heartbeatSummary={heartbeatSummaryByTaskId.get(task.task_id)}
                    key={task.task_id}
                    onOpen={openTask}
                    ownership={ownershipByTaskId.get(task.task_id)}
                    task={task}
                  />
                ))}
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      )}

      <TaskDetailModal
        detail={detailQuery.data}
        error={detailQuery.error}
        onClose={closeTask}
        opened={modalOpen}
      />
    </Stack>
  )
}
