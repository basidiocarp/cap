import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { CanopySavedView, CanopySearchParamUpdates } from './canopy-filters'
import { useCanopySnapshot, useCanopyTaskDetail, useProjectContextController } from '../../lib/queries'
import { filterCanopyTasks, groupOperatorActionsByTask, groupTasksByStatus, resolveCanopyViewState } from './canopy-filters'

export function useCanopyPageState() {
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
  const dependencyBlockedQueueSnapshotQuery = useCanopySnapshot({
    preset: 'blocked_by_dependencies',
    project: activeProject ?? undefined,
  })
  const reviewWithGraphPressureQueueSnapshotQuery = useCanopySnapshot({
    preset: 'review_with_graph_pressure',
    project: activeProject ?? undefined,
  })
  const reviewHandoffFollowThroughQueueSnapshotQuery = useCanopySnapshot({
    preset: 'review_handoff_follow_through',
    project: activeProject ?? undefined,
  })
  const reviewDecisionFollowThroughQueueSnapshotQuery = useCanopySnapshot({
    preset: 'review_decision_follow_through',
    project: activeProject ?? undefined,
  })
  const reviewAwaitingSupportQueueSnapshotQuery = useCanopySnapshot({
    preset: 'review_awaiting_support',
    project: activeProject ?? undefined,
  })
  const reviewReadyForCloseoutQueueSnapshotQuery = useCanopySnapshot({
    preset: 'review_ready_for_closeout',
    project: activeProject ?? undefined,
  })
  const handoffQueueSnapshotQuery = useCanopySnapshot({
    preset: 'handoffs',
    project: activeProject ?? undefined,
  })
  const unclaimedQueueSnapshotQuery = useCanopySnapshot({
    preset: 'unclaimed',
    project: activeProject ?? undefined,
  })
  const assignedAwaitingClaimQueueSnapshotQuery = useCanopySnapshot({
    preset: 'assigned_awaiting_claim',
    project: activeProject ?? undefined,
  })
  const claimedNotStartedQueueSnapshotQuery = useCanopySnapshot({
    preset: 'claimed_not_started',
    project: activeProject ?? undefined,
  })
  const inProgressQueueSnapshotQuery = useCanopySnapshot({
    preset: 'in_progress',
    project: activeProject ?? undefined,
  })
  const stalledQueueSnapshotQuery = useCanopySnapshot({
    preset: 'stalled',
    project: activeProject ?? undefined,
  })
  const pausedResumableQueueSnapshotQuery = useCanopySnapshot({
    preset: 'paused_resumable',
    project: activeProject ?? undefined,
  })
  const awaitingHandoffAcceptanceQueueSnapshotQuery = useCanopySnapshot({
    preset: 'awaiting_handoff_acceptance',
    project: activeProject ?? undefined,
  })
  const acceptedHandoffFollowThroughQueueSnapshotQuery = useCanopySnapshot({
    preset: 'accepted_handoff_follow_through',
    project: activeProject ?? undefined,
  })
  const followUpChainsQueueSnapshotQuery = useCanopySnapshot({
    preset: 'follow_up_chains',
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
  const executionSummaryByTaskId = useMemo(
    () => new Map(snapshot?.execution_summaries.map((summary) => [summary.task_id, summary]) ?? []),
    [snapshot?.execution_summaries]
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
    acceptedHandoffFollowThroughQueueSnapshot: {
      error: acceptedHandoffFollowThroughQueueSnapshotQuery.error,
      isLoading: acceptedHandoffFollowThroughQueueSnapshotQuery.isLoading,
      snapshot: acceptedHandoffFollowThroughQueueSnapshotQuery.data,
    },
    acknowledgedFilter,
    activeProject,
    assignedAwaitingClaimQueueSnapshot: {
      error: assignedAwaitingClaimQueueSnapshotQuery.error,
      isLoading: assignedAwaitingClaimQueueSnapshotQuery.isLoading,
      snapshot: assignedAwaitingClaimQueueSnapshotQuery.data,
    },
    availableAgents,
    awaitingHandoffAcceptanceQueueSnapshot: {
      error: awaitingHandoffAcceptanceQueueSnapshotQuery.error,
      isLoading: awaitingHandoffAcceptanceQueueSnapshotQuery.isLoading,
      snapshot: awaitingHandoffAcceptanceQueueSnapshotQuery.data,
    },
    blockedQueueSnapshot: {
      error: blockedQueueSnapshotQuery.error,
      isLoading: blockedQueueSnapshotQuery.isLoading,
      snapshot: blockedQueueSnapshotQuery.data,
    },
    claimedNotStartedQueueSnapshot: {
      error: claimedNotStartedQueueSnapshotQuery.error,
      isLoading: claimedNotStartedQueueSnapshotQuery.isLoading,
      snapshot: claimedNotStartedQueueSnapshotQuery.data,
    },
    closeTask: () => updateSearchParams({ task: null }, { replace: false }),
    criticalQueueSnapshot: {
      error: criticalQueueSnapshotQuery.error,
      isLoading: criticalQueueSnapshotQuery.isLoading,
      snapshot: criticalQueueSnapshotQuery.data,
    },
    dependencyBlockedQueueSnapshot: {
      error: dependencyBlockedQueueSnapshotQuery.error,
      isLoading: dependencyBlockedQueueSnapshotQuery.isLoading,
      snapshot: dependencyBlockedQueueSnapshotQuery.data,
    },
    detailQuery,
    executionSummaryByTaskId,
    filteredAgentAttention,
    filteredAgents,
    filteredEvidence,
    filteredHandoffAttention,
    filteredHandoffs,
    filteredTaskAttention,
    filteredTasks,
    followUpChainsQueueSnapshot: {
      error: followUpChainsQueueSnapshotQuery.error,
      isLoading: followUpChainsQueueSnapshotQuery.isLoading,
      snapshot: followUpChainsQueueSnapshotQuery.data,
    },
    groupedTasks,
    handoffQueueSnapshot: {
      error: handoffQueueSnapshotQuery.error,
      isLoading: handoffQueueSnapshotQuery.isLoading,
      snapshot: handoffQueueSnapshotQuery.data,
    },
    heartbeatSummaryByTaskId,
    inProgressQueueSnapshot: {
      error: inProgressQueueSnapshotQuery.error,
      isLoading: inProgressQueueSnapshotQuery.isLoading,
      snapshot: inProgressQueueSnapshotQuery.data,
    },
    modalOpen,
    openQueuePreset: openPreset,
    openSavedView: openPreset,
    openTask: (taskId: string) => updateSearchParams({ task: taskId }, { replace: false }),
    operatorActionsByTaskId,
    ownershipByTaskId,
    pausedResumableQueueSnapshot: {
      error: pausedResumableQueueSnapshotQuery.error,
      isLoading: pausedResumableQueueSnapshotQuery.isLoading,
      snapshot: pausedResumableQueueSnapshotQuery.data,
    },
    priorityFilter,
    relationshipSummaryByTaskId,
    reviewAwaitingSupportQueueSnapshot: {
      error: reviewAwaitingSupportQueueSnapshotQuery.error,
      isLoading: reviewAwaitingSupportQueueSnapshotQuery.isLoading,
      snapshot: reviewAwaitingSupportQueueSnapshotQuery.data,
    },
    reviewDecisionFollowThroughQueueSnapshot: {
      error: reviewDecisionFollowThroughQueueSnapshotQuery.error,
      isLoading: reviewDecisionFollowThroughQueueSnapshotQuery.isLoading,
      snapshot: reviewDecisionFollowThroughQueueSnapshotQuery.data,
    },
    reviewHandoffFollowThroughQueueSnapshot: {
      error: reviewHandoffFollowThroughQueueSnapshotQuery.error,
      isLoading: reviewHandoffFollowThroughQueueSnapshotQuery.isLoading,
      snapshot: reviewHandoffFollowThroughQueueSnapshotQuery.data,
    },
    reviewReadyForCloseoutQueueSnapshot: {
      error: reviewReadyForCloseoutQueueSnapshotQuery.error,
      isLoading: reviewReadyForCloseoutQueueSnapshotQuery.isLoading,
      snapshot: reviewReadyForCloseoutQueueSnapshotQuery.data,
    },
    reviewWithGraphPressureQueueSnapshot: {
      error: reviewWithGraphPressureQueueSnapshotQuery.error,
      isLoading: reviewWithGraphPressureQueueSnapshotQuery.isLoading,
      snapshot: reviewWithGraphPressureQueueSnapshotQuery.data,
    },
    savedView,
    searchQuery,
    severityFilter,
    snapshotQuery,
    sortMode,
    stalledQueueSnapshot: {
      error: stalledQueueSnapshotQuery.error,
      isLoading: stalledQueueSnapshotQuery.isLoading,
      snapshot: stalledQueueSnapshotQuery.data,
    },
    statusFilter,
    taskAttentionById,
    unacknowledgedQueueSnapshot: {
      error: unacknowledgedQueueSnapshotQuery.error,
      isLoading: unacknowledgedQueueSnapshotQuery.isLoading,
      snapshot: unacknowledgedQueueSnapshotQuery.data,
    },
    unclaimedQueueSnapshot: {
      error: unclaimedQueueSnapshotQuery.error,
      isLoading: unclaimedQueueSnapshotQuery.isLoading,
      snapshot: unclaimedQueueSnapshotQuery.data,
    },
    updateSearchParams,
  }
}
