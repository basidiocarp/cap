import { Button, Group, Select, Stack, Text, Textarea, TextInput } from '@mantine/core'

import type { CanopyAgentRegistration, CanopyTaskDetail, CanopyTaskPriority, CanopyTaskSeverity, CanopyVerificationState } from '../../lib/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { useTaskActionState } from './useTaskActionState'

const TASK_OPERATOR_ACTOR = 'operator'
const EXECUTION_ACTION_LABELS = {
  claim_task: 'Claim task',
  complete_task: 'Complete task',
  pause_task: 'Pause task',
  resume_task: 'Resume task',
  start_task: 'Start task',
  yield_task: 'Yield task',
} as const
const HANDOFF_ACTION_LABELS = {
  accept_handoff: 'Accept handoff',
  cancel_handoff: 'Cancel handoff',
  complete_handoff: 'Complete handoff',
  expire_handoff: 'Expire handoff',
  follow_up_handoff: 'Nudge handoff',
  reject_handoff: 'Reject handoff',
} as const
const PRIORITY_OPTIONS: { label: string; value: CanopyTaskPriority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
]
const SEVERITY_OPTIONS: { label: string; value: CanopyTaskSeverity }[] = [
  { label: 'None', value: 'none' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
]
const REVIEW_OUTCOME_OPTIONS: { label: string; value: Exclude<CanopyVerificationState, 'unknown'> }[] = [
  { label: 'Failed', value: 'failed' },
  { label: 'Pending', value: 'pending' },
]

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

  return (
    <Stack gap='md'>
      <ErrorAlert error={mutationError} />

      <Group gap='xs'>
        {allowedKinds.has('acknowledge_task') ? (
          <Button
            loading={taskActionMutation.isPending}
            onClick={() =>
              taskActionMutation.mutate({
                action: 'acknowledge_task',
                changed_by: TASK_OPERATOR_ACTOR,
                taskId: detail.task.task_id,
              })
            }
            size='xs'
            variant='light'
          >
            Acknowledge
          </Button>
        ) : null}
        {allowedKinds.has('unacknowledge_task') ? (
          <Button
            loading={taskActionMutation.isPending}
            onClick={() =>
              taskActionMutation.mutate({
                action: 'unacknowledge_task',
                changed_by: TASK_OPERATOR_ACTOR,
                taskId: detail.task.task_id,
              })
            }
            size='xs'
            variant='light'
          >
            Unacknowledge
          </Button>
        ) : null}
        {allowedKinds.has('unblock_task') ? (
          <Button
            loading={taskActionMutation.isPending}
            onClick={() =>
              taskActionMutation.mutate({
                action: 'unblock_task',
                changed_by: TASK_OPERATOR_ACTOR,
                taskId: detail.task.task_id,
              })
            }
            size='xs'
            variant='outline'
          >
            Unblock task
          </Button>
        ) : null}
      </Group>

      {allowedKinds.has('block_task') ? (
        <Group align='end'>
          <TextInput
            disabled={isPending}
            flex={1}
            label='Blocked reason'
            onChange={(event) => setBlockedReason(event.currentTarget.value)}
            placeholder='Waiting on a dependency or operator decision'
            value={blockedReason}
          />
          <Button
            disabled={!blockedReason.trim()}
            loading={taskActionMutation.isPending}
            onClick={() =>
              taskActionMutation.mutate({
                action: 'block_task',
                blocked_reason: blockedReason.trim(),
                changed_by: TASK_OPERATOR_ACTOR,
                taskId: detail.task.task_id,
              })
            }
          >
            Block task
          </Button>
        </Group>
      ) : null}

      {allowedKinds.has('verify_task') ? (
        <Stack gap='xs'>
          <Group align='end'>
            <Select
              data={REVIEW_OUTCOME_OPTIONS}
              disabled={isPending}
              label='Verification outcome'
              onChange={(value) => {
                if (value) setReviewOutcome(value as Extract<CanopyVerificationState, 'failed' | 'pending'>)
              }}
              value={reviewOutcome}
            />
            <Button
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'verify_task',
                  changed_by: TASK_OPERATOR_ACTOR,
                  note: reviewSummary.trim() || undefined,
                  taskId: detail.task.task_id,
                  verification_state: reviewOutcome,
                })
              }
            >
              Record review
            </Button>
          </Group>
          <Textarea
            autosize
            disabled={isPending}
            label='Review note'
            minRows={2}
            onChange={(event) => setReviewSummary(event.currentTarget.value)}
            placeholder='Capture what still needs work before completion'
            value={reviewSummary}
          />
        </Stack>
      ) : null}

      {allowedKinds.has('record_decision') ? (
        <Stack gap='xs'>
          <Group align='end'>
            <Select
              data={assignableAgents}
              disabled={isPending}
              flex={1}
              label='Decision author'
              onChange={(value) => setDecisionAuthorAgentId(value)}
              placeholder='Choose an agent'
              searchable
              value={decisionAuthorAgentId}
            />
            <Button
              disabled={!decisionAuthorAgentId || !decisionBody.trim()}
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'record_decision',
                  author_agent_id: decisionAuthorAgentId ?? undefined,
                  changed_by: TASK_OPERATOR_ACTOR,
                  message_body: decisionBody.trim(),
                  taskId: detail.task.task_id,
                })
              }
            >
              Record decision
            </Button>
          </Group>
          <Textarea
            autosize
            disabled={isPending}
            label='Decision body'
            minRows={2}
            onChange={(event) => setDecisionBody(event.currentTarget.value)}
            placeholder='Capture the review decision that moves this task into closeout'
            value={decisionBody}
          />
        </Stack>
      ) : null}

      {allowedKinds.has('close_task') ? (
        <Stack gap='xs'>
          <Textarea
            autosize
            disabled={isPending}
            label='Closeout summary'
            minRows={2}
            onChange={(event) => setCloseoutSummary(event.currentTarget.value)}
            placeholder='Capture the final closeout summary for this task'
            value={closeoutSummary}
          />
          <Group justify='flex-end'>
            <Button
              disabled={!closeoutSummary.trim()}
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'close_task',
                  changed_by: TASK_OPERATOR_ACTOR,
                  closure_summary: closeoutSummary.trim(),
                  taskId: detail.task.task_id,
                })
              }
            >
              Close task
            </Button>
          </Group>
        </Stack>
      ) : null}

      {allowedKinds.has('reassign_task') ? (
        <Group align='end'>
          <Select
            data={assignableAgents}
            disabled={isPending}
            flex={1}
            label='Reassign owner'
            onChange={(value) => setAssignedTo(value)}
            placeholder='Choose an agent'
            searchable
            value={assignedTo}
          />
          <TextInput
            disabled={isPending}
            flex={1}
            label='Reassign note'
            onChange={(event) => setReassignNote(event.currentTarget.value)}
            placeholder='Why this handoff or reassignment is needed'
            value={reassignNote}
          />
          <Button
            disabled={!assignedTo}
            loading={taskActionMutation.isPending}
            onClick={() =>
              taskActionMutation.mutate({
                action: 'reassign_task',
                assigned_to: assignedTo ?? undefined,
                changed_by: TASK_OPERATOR_ACTOR,
                note: reassignNote.trim() || undefined,
                taskId: detail.task.task_id,
              })
            }
          >
            Reassign
          </Button>
        </Group>
      ) : null}

      {executionActionKinds.length > 0 ? (
        <Stack gap='xs'>
          <Text fw={600}>Execution controls</Text>
          <Group align='end'>
            <Select
              data={assignableAgents}
              disabled={isPending}
              flex={1}
              label='Execution agent'
              onChange={(value) => setExecutionAgentId(value)}
              placeholder='Choose an agent'
              searchable
              value={executionAgentId}
            />
            {executionActionKinds.map((action) => (
              <Button
                disabled={!executionAgentId}
                key={action}
                loading={taskActionMutation.isPending}
                onClick={() =>
                  taskActionMutation.mutate({
                    acting_agent_id: executionAgentId ?? undefined,
                    action,
                    changed_by: TASK_OPERATOR_ACTOR,
                    note: executionNote.trim() || undefined,
                    taskId: detail.task.task_id,
                  })
                }
                variant={action === 'complete_task' ? 'filled' : 'light'}
              >
                {EXECUTION_ACTION_LABELS[action]}
              </Button>
            ))}
          </Group>
          <TextInput
            disabled={isPending}
            label='Execution note'
            onChange={(event) => setExecutionNote(event.currentTarget.value)}
            placeholder='Optional note for execution transitions'
            value={executionNote}
          />
        </Stack>
      ) : null}

      {allowedKinds.has('set_task_due_at') ||
      allowedKinds.has('clear_task_due_at') ||
      allowedKinds.has('set_review_due_at') ||
      allowedKinds.has('clear_review_due_at') ? (
        <Stack gap='xs'>
          <Text fw={600}>Deadlines</Text>
          {allowedKinds.has('set_task_due_at') || allowedKinds.has('clear_task_due_at') ? (
            <Group align='end'>
              <TextInput
                disabled={isPending}
                flex={1}
                label='Execution due at'
                onChange={(event) => setTaskDueAt(event.currentTarget.value)}
                placeholder='2026-03-30T18:00:00Z'
                value={taskDueAt}
              />
              {allowedKinds.has('set_task_due_at') ? (
                <Button
                  disabled={!taskDueAt.trim()}
                  loading={taskActionMutation.isPending}
                  onClick={() =>
                    taskActionMutation.mutate({
                      action: 'set_task_due_at',
                      changed_by: TASK_OPERATOR_ACTOR,
                      due_at: taskDueAt.trim(),
                      taskId: detail.task.task_id,
                    })
                  }
                  variant='light'
                >
                  Set execution due
                </Button>
              ) : null}
              {allowedKinds.has('clear_task_due_at') ? (
                <Button
                  loading={taskActionMutation.isPending}
                  onClick={() =>
                    taskActionMutation.mutate({
                      action: 'clear_task_due_at',
                      changed_by: TASK_OPERATOR_ACTOR,
                      taskId: detail.task.task_id,
                    })
                  }
                  variant='subtle'
                >
                  Clear execution due
                </Button>
              ) : null}
            </Group>
          ) : null}
          {allowedKinds.has('set_review_due_at') || allowedKinds.has('clear_review_due_at') ? (
            <Group align='end'>
              <TextInput
                disabled={isPending}
                flex={1}
                label='Review due at'
                onChange={(event) => setReviewDueAt(event.currentTarget.value)}
                placeholder='2026-03-31T18:00:00Z'
                value={reviewDueAt}
              />
              {allowedKinds.has('set_review_due_at') ? (
                <Button
                  disabled={!reviewDueAt.trim()}
                  loading={taskActionMutation.isPending}
                  onClick={() =>
                    taskActionMutation.mutate({
                      action: 'set_review_due_at',
                      changed_by: TASK_OPERATOR_ACTOR,
                      review_due_at: reviewDueAt.trim(),
                      taskId: detail.task.task_id,
                    })
                  }
                  variant='light'
                >
                  Set review due
                </Button>
              ) : null}
              {allowedKinds.has('clear_review_due_at') ? (
                <Button
                  loading={taskActionMutation.isPending}
                  onClick={() =>
                    taskActionMutation.mutate({
                      action: 'clear_review_due_at',
                      changed_by: TASK_OPERATOR_ACTOR,
                      taskId: detail.task.task_id,
                    })
                  }
                  variant='subtle'
                >
                  Clear review due
                </Button>
              ) : null}
            </Group>
          ) : null}
        </Stack>
      ) : null}

      {allowedKinds.has('resolve_dependency') ||
      allowedKinds.has('promote_follow_up') ||
      allowedKinds.has('reopen_blocked_task_when_unblocked') ||
      allowedKinds.has('close_follow_up_chain') ? (
        <Stack gap='xs'>
          <Text fw={600}>Graph actions</Text>
          {allowedKinds.has('resolve_dependency') ? (
            <Group align='end'>
              <Select
                data={dependencyOptions}
                disabled={isPending}
                flex={1}
                label='Dependency to resolve'
                onChange={(value) => setDependencyTaskId(value)}
                placeholder='Choose a related blocker or blocked task'
                searchable
                value={dependencyTaskId}
              />
              <Button
                disabled={!dependencyTaskId}
                loading={taskActionMutation.isPending}
                onClick={() =>
                  taskActionMutation.mutate({
                    action: 'resolve_dependency',
                    changed_by: TASK_OPERATOR_ACTOR,
                    note: graphNote.trim() || undefined,
                    related_task_id: dependencyTaskId ?? undefined,
                    taskId: detail.task.task_id,
                  })
                }
                variant='light'
              >
                Resolve dependency
              </Button>
            </Group>
          ) : null}
          {allowedKinds.has('promote_follow_up') ? (
            <Group align='end'>
              <Select
                data={followUpOptions}
                disabled={isPending}
                flex={1}
                label='Follow-up to promote'
                onChange={(value) => setFollowUpTaskId(value)}
                placeholder='Choose a follow-up child task'
                searchable
                value={followUpTaskId}
              />
              <Button
                disabled={!followUpTaskId}
                loading={taskActionMutation.isPending}
                onClick={() =>
                  taskActionMutation.mutate({
                    action: 'promote_follow_up',
                    changed_by: TASK_OPERATOR_ACTOR,
                    note: graphNote.trim() || undefined,
                    related_task_id: followUpTaskId ?? undefined,
                    taskId: detail.task.task_id,
                  })
                }
                variant='light'
              >
                Promote follow-up
              </Button>
            </Group>
          ) : null}
          {allowedKinds.has('reopen_blocked_task_when_unblocked') || allowedKinds.has('close_follow_up_chain') ? (
            <Group gap='xs'>
              {allowedKinds.has('reopen_blocked_task_when_unblocked') ? (
                <Button
                  loading={taskActionMutation.isPending}
                  onClick={() =>
                    taskActionMutation.mutate({
                      action: 'reopen_blocked_task_when_unblocked',
                      changed_by: TASK_OPERATOR_ACTOR,
                      note: graphNote.trim() || undefined,
                      taskId: detail.task.task_id,
                    })
                  }
                  variant='outline'
                >
                  Reopen blocked task
                </Button>
              ) : null}
              {allowedKinds.has('close_follow_up_chain') ? (
                <Button
                  loading={taskActionMutation.isPending}
                  onClick={() =>
                    taskActionMutation.mutate({
                      action: 'close_follow_up_chain',
                      changed_by: TASK_OPERATOR_ACTOR,
                      note: graphNote.trim() || undefined,
                      taskId: detail.task.task_id,
                    })
                  }
                  variant='outline'
                >
                  Close follow-up chain
                </Button>
              ) : null}
            </Group>
          ) : null}
          <TextInput
            disabled={isPending}
            label='Graph action note'
            onChange={(event) => setGraphNote(event.currentTarget.value)}
            placeholder='Optional note for dependency or follow-up changes'
            value={graphNote}
          />
        </Stack>
      ) : null}

      <Group align='end'>
        {allowedKinds.has('set_task_priority') ? (
          <>
            <Select
              data={PRIORITY_OPTIONS}
              disabled={isPending}
              label='Priority'
              onChange={(value) => {
                if (value) setPriority(value as CanopyTaskPriority)
              }}
              value={priority}
            />
            <Button
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'set_task_priority',
                  changed_by: TASK_OPERATOR_ACTOR,
                  priority,
                  taskId: detail.task.task_id,
                })
              }
              variant='light'
            >
              Save priority
            </Button>
          </>
        ) : null}
        {allowedKinds.has('set_task_severity') ? (
          <>
            <Select
              data={SEVERITY_OPTIONS}
              disabled={isPending}
              label='Severity'
              onChange={(value) => {
                if (value) setSeverity(value as CanopyTaskSeverity)
              }}
              value={severity}
            />
            <Button
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'set_task_severity',
                  changed_by: TASK_OPERATOR_ACTOR,
                  severity,
                  taskId: detail.task.task_id,
                })
              }
              variant='light'
            >
              Save severity
            </Button>
          </>
        ) : null}
      </Group>

      {allowedKinds.has('update_task_note') ? (
        <Stack gap='xs'>
          <Textarea
            autosize
            disabled={isPending}
            label='Operator note'
            minRows={3}
            onChange={(event) => setOwnerNote(event.currentTarget.value)}
            placeholder='Capture handoff context, recovery notes, or triage guidance'
            value={ownerNote}
          />
          <Group gap='xs'>
            <Button
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'update_task_note',
                  changed_by: TASK_OPERATOR_ACTOR,
                  owner_note: ownerNote.trim() || undefined,
                  taskId: detail.task.task_id,
                })
              }
              variant='light'
            >
              Save note
            </Button>
            <Button
              loading={taskActionMutation.isPending}
              onClick={() =>
                taskActionMutation.mutate({
                  action: 'update_task_note',
                  changed_by: TASK_OPERATOR_ACTOR,
                  clear_owner_note: true,
                  taskId: detail.task.task_id,
                })
              }
              variant='subtle'
            >
              Clear note
            </Button>
          </Group>
        </Stack>
      ) : null}

      {openHandoffs.length > 0 ? (
        <Stack gap='xs'>
          <Text fw={600}>Open handoffs</Text>
          {openHandoffs.map((handoff) => (
            <Stack
              gap='xs'
              key={handoff.handoff_id}
            >
              <Text size='sm'>
                {handoff.summary} to {handoff.to_agent_id}
              </Text>
              <Group align='end'>
                <TextInput
                  disabled={isPending}
                  flex={1}
                  label='Follow-up note'
                  onChange={(event) =>
                    setHandoffNotes((current) => ({
                      ...current,
                      [handoff.handoff_id]: event.currentTarget.value,
                    }))
                  }
                  placeholder='Optional note for handoff follow-up'
                  value={handoffNotes[handoff.handoff_id] ?? ''}
                />
                {(handoffActionsById.get(handoff.handoff_id) ?? []).map((action) => (
                  <Button
                    color={action === 'expire_handoff' ? 'red' : undefined}
                    key={`${handoff.handoff_id}-${action}`}
                    loading={handoffActionMutation.isPending}
                    onClick={() =>
                      handoffActionMutation.mutate({
                        acting_agent_id: action === 'accept_handoff' || action === 'reject_handoff' ? handoff.to_agent_id : undefined,
                        action,
                        changed_by: TASK_OPERATOR_ACTOR,
                        handoffId: handoff.handoff_id,
                        note: handoffNotes[handoff.handoff_id]?.trim() || undefined,
                        taskId: detail.task.task_id,
                      })
                    }
                    variant={action === 'expire_handoff' ? 'outline' : 'light'}
                  >
                    {HANDOFF_ACTION_LABELS[action]}
                  </Button>
                ))}
              </Group>
            </Stack>
          ))}
        </Stack>
      ) : null}
    </Stack>
  )
}
