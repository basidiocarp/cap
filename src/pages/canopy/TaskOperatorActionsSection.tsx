import { Button, Group, Select, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'

import type { CanopyAgentRegistration, CanopyTaskDetail, CanopyTaskPriority, CanopyTaskSeverity } from '../../lib/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { useCanopyHandoffAction, useCanopyTaskAction } from '../../lib/queries'

const TASK_OPERATOR_ACTOR = 'operator'
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

export function TaskOperatorActionsSection({ detail, agents }: { detail: CanopyTaskDetail; agents: CanopyAgentRegistration[] }) {
  const taskActionMutation = useCanopyTaskAction()
  const handoffActionMutation = useCanopyHandoffAction()
  const [priority, setPriority] = useState<CanopyTaskPriority>(detail.task.priority)
  const [severity, setSeverity] = useState<CanopyTaskSeverity>(detail.task.severity)
  const [ownerNote, setOwnerNote] = useState(detail.task.owner_note ?? '')
  const [blockedReason, setBlockedReason] = useState(detail.task.blocked_reason ?? '')
  const [assignedTo, setAssignedTo] = useState<string | null>(detail.task.owner_agent_id ?? agents[0]?.agent_id ?? null)
  const [reassignNote, setReassignNote] = useState('')
  const [handoffNotes, setHandoffNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    setPriority(detail.task.priority)
    setSeverity(detail.task.severity)
    setOwnerNote(detail.task.owner_note ?? '')
    setBlockedReason(detail.task.blocked_reason ?? '')
    setAssignedTo(detail.task.owner_agent_id ?? agents[0]?.agent_id ?? null)
    setReassignNote('')
    setHandoffNotes({})
  }, [agents, detail])

  const allowedKinds = useMemo(() => new Set(detail.allowed_actions.map((action) => action.kind)), [detail.allowed_actions])
  const openHandoffs = detail.handoffs.filter((handoff) => handoff.status === 'open')
  const assignableAgents = useMemo(
    () =>
      agents.map((agent) => ({
        label: `${agent.agent_id} · ${agent.host_type} · ${agent.model}`,
        value: agent.agent_id,
      })),
    [agents]
  )
  const isPending = taskActionMutation.isPending || handoffActionMutation.isPending
  const mutationError =
    taskActionMutation.error instanceof Error
      ? taskActionMutation.error
      : handoffActionMutation.error instanceof Error
        ? handoffActionMutation.error
        : null

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
                {allowedKinds.has('follow_up_handoff') ? (
                  <Button
                    loading={handoffActionMutation.isPending}
                    onClick={() =>
                      handoffActionMutation.mutate({
                        action: 'follow_up_handoff',
                        changed_by: TASK_OPERATOR_ACTOR,
                        handoffId: handoff.handoff_id,
                        note: handoffNotes[handoff.handoff_id]?.trim() || undefined,
                        taskId: detail.task.task_id,
                      })
                    }
                    variant='light'
                  >
                    Nudge handoff
                  </Button>
                ) : null}
                {allowedKinds.has('expire_handoff') ? (
                  <Button
                    color='red'
                    loading={handoffActionMutation.isPending}
                    onClick={() =>
                      handoffActionMutation.mutate({
                        action: 'expire_handoff',
                        changed_by: TASK_OPERATOR_ACTOR,
                        handoffId: handoff.handoff_id,
                        note: handoffNotes[handoff.handoff_id]?.trim() || undefined,
                        taskId: detail.task.task_id,
                      })
                    }
                    variant='outline'
                  >
                    Expire handoff
                  </Button>
                ) : null}
              </Group>
            </Stack>
          ))}
        </Stack>
      ) : null}
    </Stack>
  )
}
