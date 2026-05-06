import { Button, Group, TextInput } from '@mantine/core'

import type { useCanopyTaskAction } from '../../lib/queries'

const TASK_OPERATOR_ACTOR = 'operator'

interface Props {
  allowedKinds: Set<string>
  blockedReason: string
  isPending: boolean
  setBlockedReason: (value: string) => void
  taskActionMutation: ReturnType<typeof useCanopyTaskAction>
  taskId: string
}

export function TaskLifecycleActionsGroup({ allowedKinds, blockedReason, isPending, setBlockedReason, taskActionMutation, taskId }: Props) {
  return (
    <>
      <Group gap='xs'>
        {allowedKinds.has('acknowledge_task') ? (
          <Button
            loading={taskActionMutation.isPending}
            onClick={() => taskActionMutation.mutate({ action: 'acknowledge_task', changed_by: TASK_OPERATOR_ACTOR, taskId })}
            size='xs'
            variant='light'
          >
            Acknowledge
          </Button>
        ) : null}
        {allowedKinds.has('unacknowledge_task') ? (
          <Button
            loading={taskActionMutation.isPending}
            onClick={() => taskActionMutation.mutate({ action: 'unacknowledge_task', changed_by: TASK_OPERATOR_ACTOR, taskId })}
            size='xs'
            variant='light'
          >
            Unacknowledge
          </Button>
        ) : null}
        {allowedKinds.has('unblock_task') ? (
          <Button
            loading={taskActionMutation.isPending}
            onClick={() => taskActionMutation.mutate({ action: 'unblock_task', changed_by: TASK_OPERATOR_ACTOR, taskId })}
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
                taskId,
              })
            }
          >
            Block task
          </Button>
        </Group>
      ) : null}
    </>
  )
}
