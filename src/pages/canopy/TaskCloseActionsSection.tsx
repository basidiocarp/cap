import { Button, Group, Stack, Textarea } from '@mantine/core'

import type { useCanopyTaskAction } from '../../lib/queries'

const TASK_OPERATOR_ACTOR = 'operator'

interface Props {
  allowedKinds: Set<string>
  closeoutSummary: string
  isPending: boolean
  setCloseoutSummary: (value: string) => void
  taskActionMutation: ReturnType<typeof useCanopyTaskAction>
  taskId: string
}

export function TaskCloseActionsSection({ allowedKinds, closeoutSummary, isPending, setCloseoutSummary, taskActionMutation, taskId }: Props) {
  if (!allowedKinds.has('close_task')) return null

  return (
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
              taskId,
            })
          }
        >
          Close task
        </Button>
      </Group>
    </Stack>
  )
}
