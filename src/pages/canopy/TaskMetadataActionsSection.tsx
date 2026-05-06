import { Button, Group, Select, Stack, Textarea } from '@mantine/core'

import type { CanopyTaskPriority, CanopyTaskSeverity } from '../../lib/api'
import type { useCanopyTaskAction } from '../../lib/queries'

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

interface Props {
  allowedKinds: Set<string>
  isPending: boolean
  ownerNote: string
  priority: CanopyTaskPriority
  setOwnerNote: (value: string) => void
  setPriority: (value: CanopyTaskPriority) => void
  setSeverity: (value: CanopyTaskSeverity) => void
  severity: CanopyTaskSeverity
  taskActionMutation: ReturnType<typeof useCanopyTaskAction>
  taskId: string
}

export function TaskMetadataActionsSection({
  allowedKinds,
  isPending,
  ownerNote,
  priority,
  setOwnerNote,
  setPriority,
  setSeverity,
  severity,
  taskActionMutation,
  taskId,
}: Props) {
  return (
    <>
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
                  taskId,
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
                  taskId,
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
                  taskId,
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
                  taskId,
                })
              }
              variant='subtle'
            >
              Clear note
            </Button>
          </Group>
        </Stack>
      ) : null}
    </>
  )
}
