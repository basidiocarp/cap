import { Button, Group, Select, Stack, Text, TextInput } from '@mantine/core'

import type { useCanopyTaskAction } from '../../lib/queries'

const TASK_OPERATOR_ACTOR = 'operator'
const EXECUTION_ACTION_LABELS = {
  claim_task: 'Claim task',
  complete_task: 'Complete task',
  pause_task: 'Pause task',
  resume_task: 'Resume task',
  start_task: 'Start task',
  yield_task: 'Yield task',
} as const

interface Props {
  allowedKinds: Set<string>
  assignableAgents: { label: string; value: string }[]
  assignedTo: string | null
  executionActionKinds: (keyof typeof EXECUTION_ACTION_LABELS)[]
  executionAgentId: string | null
  executionNote: string
  isPending: boolean
  reassignNote: string
  setAssignedTo: (value: string | null) => void
  setExecutionAgentId: (value: string | null) => void
  setExecutionNote: (value: string) => void
  setReassignNote: (value: string) => void
  taskActionMutation: ReturnType<typeof useCanopyTaskAction>
  taskId: string
}

export function TaskAssignmentActionsSection({
  allowedKinds,
  assignableAgents,
  assignedTo,
  executionActionKinds,
  executionAgentId,
  executionNote,
  isPending,
  reassignNote,
  setAssignedTo,
  setExecutionAgentId,
  setExecutionNote,
  setReassignNote,
  taskActionMutation,
  taskId,
}: Props) {
  return (
    <>
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
                taskId,
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
                    taskId,
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
    </>
  )
}
