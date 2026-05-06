import { Button, Group, Stack, Text, TextInput } from '@mantine/core'

import type { useCanopyTaskAction } from '../../lib/queries'

const TASK_OPERATOR_ACTOR = 'operator'

interface Props {
  allowedKinds: Set<string>
  isPending: boolean
  reviewDueAt: string
  setReviewDueAt: (value: string) => void
  setTaskDueAt: (value: string) => void
  taskActionMutation: ReturnType<typeof useCanopyTaskAction>
  taskDueAt: string
  taskId: string
}

export function TaskDeadlineActionsSection({
  allowedKinds,
  isPending,
  reviewDueAt,
  setReviewDueAt,
  setTaskDueAt,
  taskActionMutation,
  taskDueAt,
  taskId,
}: Props) {
  const hasTaskDueActions = allowedKinds.has('set_task_due_at') || allowedKinds.has('clear_task_due_at')
  const hasReviewDueActions = allowedKinds.has('set_review_due_at') || allowedKinds.has('clear_review_due_at')

  if (!hasTaskDueActions && !hasReviewDueActions) return null

  return (
    <Stack gap='xs'>
      <Text fw={600}>Deadlines</Text>
      {hasTaskDueActions ? (
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
                  taskId,
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
                  taskId,
                })
              }
              variant='subtle'
            >
              Clear execution due
            </Button>
          ) : null}
        </Group>
      ) : null}
      {hasReviewDueActions ? (
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
                  taskId,
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
                  taskId,
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
  )
}
