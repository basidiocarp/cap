import { Button, Group, Select, Stack, Text, TextInput } from '@mantine/core'

import type { useCanopyTaskAction } from '../../lib/queries'

const TASK_OPERATOR_ACTOR = 'operator'

interface Props {
  allowedKinds: Set<string>
  dependencyOptions: { label: string; value: string }[]
  dependencyTaskId: string | null
  followUpOptions: { label: string; value: string }[]
  followUpTaskId: string | null
  graphNote: string
  isPending: boolean
  setDependencyTaskId: (value: string | null) => void
  setFollowUpTaskId: (value: string | null) => void
  setGraphNote: (value: string) => void
  taskActionMutation: ReturnType<typeof useCanopyTaskAction>
  taskId: string
}

export function TaskGraphActionsSection({
  allowedKinds,
  dependencyOptions,
  dependencyTaskId,
  followUpOptions,
  followUpTaskId,
  graphNote,
  isPending,
  setDependencyTaskId,
  setFollowUpTaskId,
  setGraphNote,
  taskActionMutation,
  taskId,
}: Props) {
  const hasGraphActions =
    allowedKinds.has('resolve_dependency') ||
    allowedKinds.has('promote_follow_up') ||
    allowedKinds.has('reopen_blocked_task_when_unblocked') ||
    allowedKinds.has('close_follow_up_chain')

  if (!hasGraphActions) return null

  return (
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
                taskId,
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
                taskId,
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
                  taskId,
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
                  taskId,
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
  )
}
