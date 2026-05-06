import { Stack } from '@mantine/core'

import type { CanopyAgentRegistration, CanopyTaskDetail } from '../../lib/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { useTaskActionState } from './useTaskActionState'
import { TaskAssignmentActionsSection } from './TaskAssignmentActionsSection'
import { TaskCloseActionsSection } from './TaskCloseActionsSection'
import { TaskDeadlineActionsSection } from './TaskDeadlineActionsSection'
import { TaskGraphActionsSection } from './TaskGraphActionsSection'
import { TaskLifecycleActionsGroup } from './TaskLifecycleActionsGroup'
import { TaskMetadataActionsSection } from './TaskMetadataActionsSection'
import { TaskOpenHandoffActions } from './TaskOpenHandoffActions'
import { TaskReviewActionsSection } from './TaskReviewActionsSection'

export function TaskOperatorActionsSection({ detail, agents }: { detail: CanopyTaskDetail; agents: CanopyAgentRegistration[] }) {
  const {
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
  } = useTaskActionState(detail, agents)

  const taskId = detail.task.task_id

  return (
    <Stack gap='md'>
      <ErrorAlert error={mutationError} />

      <TaskLifecycleActionsGroup
        allowedKinds={allowedKinds}
        blockedReason={blockedReason}
        isPending={isPending}
        setBlockedReason={setBlockedReason}
        taskActionMutation={taskActionMutation}
        taskId={taskId}
      />

      <TaskReviewActionsSection
        allowedKinds={allowedKinds}
        assignableAgents={assignableAgents}
        decisionAuthorAgentId={decisionAuthorAgentId}
        decisionBody={decisionBody}
        isPending={isPending}
        reviewOutcome={reviewOutcome}
        reviewSummary={reviewSummary}
        setDecisionAuthorAgentId={setDecisionAuthorAgentId}
        setDecisionBody={setDecisionBody}
        setReviewOutcome={setReviewOutcome}
        setReviewSummary={setReviewSummary}
        taskActionMutation={taskActionMutation}
        taskId={taskId}
      />

      <TaskCloseActionsSection
        allowedKinds={allowedKinds}
        closeoutSummary={closeoutSummary}
        isPending={isPending}
        setCloseoutSummary={setCloseoutSummary}
        taskActionMutation={taskActionMutation}
        taskId={taskId}
      />

      <TaskAssignmentActionsSection
        allowedKinds={allowedKinds}
        assignableAgents={assignableAgents}
        assignedTo={assignedTo}
        executionActionKinds={executionActionKinds}
        executionAgentId={executionAgentId}
        executionNote={executionNote}
        isPending={isPending}
        reassignNote={reassignNote}
        setAssignedTo={setAssignedTo}
        setExecutionAgentId={setExecutionAgentId}
        setExecutionNote={setExecutionNote}
        setReassignNote={setReassignNote}
        taskActionMutation={taskActionMutation}
        taskId={taskId}
      />

      <TaskDeadlineActionsSection
        allowedKinds={allowedKinds}
        isPending={isPending}
        reviewDueAt={reviewDueAt}
        setReviewDueAt={setReviewDueAt}
        setTaskDueAt={setTaskDueAt}
        taskActionMutation={taskActionMutation}
        taskDueAt={taskDueAt}
        taskId={taskId}
      />

      <TaskGraphActionsSection
        allowedKinds={allowedKinds}
        dependencyOptions={dependencyOptions}
        dependencyTaskId={dependencyTaskId}
        followUpOptions={followUpOptions}
        followUpTaskId={followUpTaskId}
        graphNote={graphNote}
        isPending={isPending}
        setDependencyTaskId={setDependencyTaskId}
        setFollowUpTaskId={setFollowUpTaskId}
        setGraphNote={setGraphNote}
        taskActionMutation={taskActionMutation}
        taskId={taskId}
      />

      <TaskMetadataActionsSection
        allowedKinds={allowedKinds}
        isPending={isPending}
        ownerNote={ownerNote}
        priority={priority}
        setOwnerNote={setOwnerNote}
        setPriority={setPriority}
        setSeverity={setSeverity}
        severity={severity}
        taskActionMutation={taskActionMutation}
        taskId={taskId}
      />

      <TaskOpenHandoffActions
        handoffActionsById={handoffActionsById}
        handoffActionMutation={handoffActionMutation}
        handoffNotes={handoffNotes}
        isPending={isPending}
        openHandoffs={openHandoffs}
        setHandoffNotes={setHandoffNotes}
        taskId={taskId}
      />
    </Stack>
  )
}
