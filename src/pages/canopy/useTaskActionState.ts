import { useEffect, useMemo, useState } from 'react'

import type {
  CanopyAgentRegistration,
  CanopyHandoffActionInput,
  CanopyTaskDetail,
  CanopyTaskPriority,
  CanopyTaskSeverity,
  CanopyVerificationState,
} from '../../lib/api'
import { useCanopyHandoffAction, useCanopyTaskAction } from '../../lib/queries'

const EXECUTION_ACTION_ORDER = ['claim_task', 'start_task', 'resume_task', 'pause_task', 'yield_task', 'complete_task'] as const
const HANDOFF_ACTION_ORDER = [
  'accept_handoff',
  'reject_handoff',
  'complete_handoff',
  'cancel_handoff',
  'follow_up_handoff',
  'expire_handoff',
] as const

export function useTaskActionState(detail: CanopyTaskDetail, agents: CanopyAgentRegistration[]) {
  const taskActionMutation = useCanopyTaskAction()
  const handoffActionMutation = useCanopyHandoffAction()

  const [priority, setPriority] = useState<CanopyTaskPriority>(detail.task.priority)
  const [severity, setSeverity] = useState<CanopyTaskSeverity>(detail.task.severity)
  const [ownerNote, setOwnerNote] = useState(detail.task.owner_note ?? '')
  const [blockedReason, setBlockedReason] = useState(detail.task.blocked_reason ?? '')
  const [assignedTo, setAssignedTo] = useState<string | null>(detail.task.owner_agent_id ?? agents[0]?.agent_id ?? null)
  const [reassignNote, setReassignNote] = useState('')
  const [executionAgentId, setExecutionAgentId] = useState<string | null>(
    detail.task.owner_agent_id ?? agents[0]?.agent_id ?? null
  )
  const [executionNote, setExecutionNote] = useState('')
  const [reviewOutcome, setReviewOutcome] = useState<Extract<CanopyVerificationState, 'failed' | 'pending'>>(
    detail.task.verification_state === 'failed' ? 'failed' : 'pending'
  )
  const [reviewSummary, setReviewSummary] = useState('')
  const [decisionAuthorAgentId, setDecisionAuthorAgentId] = useState<string | null>(detail.task.owner_agent_id ?? null)
  const [decisionBody, setDecisionBody] = useState('')
  const [closeoutSummary, setCloseoutSummary] = useState('')
  const [taskDueAt, setTaskDueAt] = useState(detail.deadline_summary.due_at ?? '')
  const [reviewDueAt, setReviewDueAt] = useState(detail.deadline_summary.review_due_at ?? '')
  const [handoffNotes, setHandoffNotes] = useState<Record<string, string>>({})
  const [dependencyTaskId, setDependencyTaskId] = useState<string | null>(null)
  const [followUpTaskId, setFollowUpTaskId] = useState<string | null>(null)
  const [graphNote, setGraphNote] = useState('')

  useEffect(() => {
    const firstDependency =
      detail.related_tasks.find((task) => task.relationship_role === 'blocked_by' || task.relationship_role === 'blocks')
        ?.related_task_id ?? null
    const firstFollowUp = detail.related_tasks.find((task) => task.relationship_role === 'follow_up_child')?.related_task_id ?? null

    setPriority(detail.task.priority)
    setSeverity(detail.task.severity)
    setOwnerNote(detail.task.owner_note ?? '')
    setBlockedReason(detail.task.blocked_reason ?? '')
    setAssignedTo(detail.task.owner_agent_id ?? agents[0]?.agent_id ?? null)
    setReassignNote('')
    setExecutionAgentId(detail.task.owner_agent_id ?? agents[0]?.agent_id ?? null)
    setExecutionNote('')
    setReviewOutcome(detail.task.verification_state === 'failed' ? 'failed' : 'pending')
    setReviewSummary('')
    setDecisionAuthorAgentId(detail.task.owner_agent_id ?? null)
    setDecisionBody('')
    setCloseoutSummary('')
    setTaskDueAt(detail.deadline_summary.due_at ?? '')
    setReviewDueAt(detail.deadline_summary.review_due_at ?? '')
    setHandoffNotes({})
    setDependencyTaskId(firstDependency)
    setFollowUpTaskId(firstFollowUp)
    setGraphNote('')
  }, [agents, detail])

  const allowedKinds = useMemo(() => new Set(detail.allowed_actions.map((action) => action.kind)), [detail.allowed_actions])
  const openHandoffs = detail.handoffs.filter((handoff) => handoff.status === 'open')
  const handoffActionsById = useMemo(
    () =>
      new Map(
        openHandoffs.map((handoff) => [
          handoff.handoff_id,
          HANDOFF_ACTION_ORDER.filter((action): action is CanopyHandoffActionInput['action'] =>
            detail.allowed_actions.some(
              (allowedAction) =>
                allowedAction.target_kind === 'handoff' && allowedAction.handoff_id === handoff.handoff_id && allowedAction.kind === action
            )
          ),
        ])
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detail.allowed_actions, openHandoffs]
  )
  const assignableAgents = useMemo(
    () =>
      agents.map((agent) => ({
        label: `${agent.agent_id} · ${agent.host_type} · ${agent.model}`,
        value: agent.agent_id,
      })),
    [agents]
  )
  const executionActionKinds = useMemo(() => EXECUTION_ACTION_ORDER.filter((action) => allowedKinds.has(action)), [allowedKinds])
  const dependencyOptions = useMemo(
    () =>
      detail.related_tasks
        .filter((task) => task.relationship_role === 'blocked_by' || task.relationship_role === 'blocks')
        .map((task) => ({
          label: `${task.title} · ${task.relationship_role.replaceAll('_', ' ')}`,
          value: task.related_task_id,
        })),
    [detail.related_tasks]
  )
  const followUpOptions = useMemo(
    () =>
      detail.related_tasks
        .filter((task) => task.relationship_role === 'follow_up_child')
        .map((task) => ({
          label: `${task.title} · ${task.status}`,
          value: task.related_task_id,
        })),
    [detail.related_tasks]
  )
  const isPending = taskActionMutation.isPending || handoffActionMutation.isPending
  const mutationError =
    taskActionMutation.error instanceof Error
      ? taskActionMutation.error
      : handoffActionMutation.error instanceof Error
        ? handoffActionMutation.error
        : null

  return {
    allowedKinds,
    assignableAgents,
    assignedTo,
    blockedReason,
    closeoutSummary,
    decisionAuthorAgentId,
    decisionBody,
    dependencyOptions,
    dependencyTaskId,
    executionActionKinds,
    executionAgentId,
    executionNote,
    followUpOptions,
    followUpTaskId,
    graphNote,
    handoffActionMutation,
    handoffActionsById,
    handoffNotes,
    isPending,
    mutationError,
    openHandoffs,
    ownerNote,
    priority,
    reassignNote,
    reviewDueAt,
    reviewOutcome,
    reviewSummary,
    setAssignedTo,
    setBlockedReason,
    setCloseoutSummary,
    setDecisionAuthorAgentId,
    setDecisionBody,
    setDependencyTaskId,
    setExecutionAgentId,
    setExecutionNote,
    setFollowUpTaskId,
    setGraphNote,
    setHandoffNotes,
    setOwnerNote,
    setPriority,
    setReassignNote,
    setReviewDueAt,
    setReviewOutcome,
    setReviewSummary,
    setSeverity,
    setTaskDueAt,
    severity,
    taskActionMutation,
    taskDueAt,
  }
}
