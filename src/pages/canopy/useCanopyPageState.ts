import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { CanopySavedView, CanopySearchParamUpdates } from './canopy-filters'
import { useCanopySnapshot, useCanopyTaskDetail, useProjectContextController } from '../../lib/queries'
import { filterCanopyTasks, groupOperatorActionsByTask, groupTasksByStatus, resolveCanopyViewState } from './canopy-filters'
import { useCanopyQueueSnapshots } from './useCanopyQueueSnapshots'

export function useCanopyPageState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { acknowledgedFilter, priorityFilter, savedView, searchQuery, selectedTaskId, severityFilter, sortMode, statusFilter } =
    resolveCanopyViewState(searchParams)
  const modalOpen = Boolean(selectedTaskId)
  const { data: project } = useProjectContextController()
  const activeProject = project?.active ?? null

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

  // Defer all 35 queue badge queries until the primary snapshot has resolved.
  // On first render this cuts simultaneous queries from ~37 down to 1-3.
  const queueSnapshots = useCanopyQueueSnapshots(activeProject ?? undefined, !!snapshot)

  const availableAgents = snapshot?.agents ?? []

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
  const relationshipSummaryByTaskId = useMemo(
    () => new Map(snapshot?.relationship_summaries.map((summary) => [summary.task_id, summary]) ?? []),
    [snapshot?.relationship_summaries]
  )
  const slaSummaryByTaskId = useMemo(
    () => new Map(snapshot?.task_sla_summaries.map((summary) => [summary.task_id, summary]) ?? []),
    [snapshot?.task_sla_summaries]
  )
  const executionSummaryByTaskId = useMemo(
    () => new Map(snapshot?.execution_summaries.map((summary) => [summary.task_id, summary]) ?? []),
    [snapshot?.execution_summaries]
  )
  const deadlineSummaryByTaskId = useMemo(
    () => new Map(snapshot?.deadline_summaries.map((summary) => [summary.task_id, summary]) ?? []),
    [snapshot?.deadline_summaries]
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
  const groupedTasks = useMemo(() => groupTasksByStatus(filteredTasks), [filteredTasks])

  const updateSearchParams = (updates: CanopySearchParamUpdates, options?: { replace?: boolean }) => {
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

  const openPreset = (preset: CanopySavedView) =>
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

  return {
    acknowledgedFilter,
    activeProject,
    availableAgents,
    closeTask: () => updateSearchParams({ task: null }, { replace: false }),
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
    openQueuePreset: openPreset,
    openSavedView: openPreset,
    openTask: (taskId: string) => updateSearchParams({ task: taskId }, { replace: false }),
    operatorActionsByTaskId,
    ownershipByTaskId,
    priorityFilter,
    queueSnapshots,
    relationshipSummaryByTaskId,
    savedView,
    searchQuery,
    severityFilter,
    slaSummaryByTaskId,
    snapshotQuery,
    snapshotSlaSummary: snapshot?.sla_summary,
    sortMode,
    statusFilter,
    taskAttentionById,
    updateSearchParams,
  }
}
