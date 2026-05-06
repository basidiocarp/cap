import { Button, Group, Stack, Text, TextInput } from '@mantine/core'

import type { CanopyHandoff } from '../../lib/api'
import type { useCanopyHandoffAction } from '../../lib/queries'

const TASK_OPERATOR_ACTOR = 'operator'
const HANDOFF_ACTION_LABELS = {
  accept_handoff: 'Accept handoff',
  cancel_handoff: 'Cancel handoff',
  complete_handoff: 'Complete handoff',
  expire_handoff: 'Expire handoff',
  follow_up_handoff: 'Nudge handoff',
  reject_handoff: 'Reject handoff',
} as const

interface Props {
  handoffActionsById: Map<string, (keyof typeof HANDOFF_ACTION_LABELS)[]>
  handoffActionMutation: ReturnType<typeof useCanopyHandoffAction>
  handoffNotes: Record<string, string>
  isPending: boolean
  openHandoffs: CanopyHandoff[]
  setHandoffNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>
  taskId: string
}

export function TaskOpenHandoffActions({
  handoffActionsById,
  handoffActionMutation,
  handoffNotes,
  isPending,
  openHandoffs,
  setHandoffNotes,
  taskId,
}: Props) {
  if (openHandoffs.length === 0) return null

  return (
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
                    taskId,
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
  )
}
