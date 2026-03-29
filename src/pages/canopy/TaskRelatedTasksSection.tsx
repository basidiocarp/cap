import { Anchor, Badge, Group, Stack, Text } from '@mantine/core'

import type { CanopyTaskDetail } from '../../lib/api'
import { statusColor, verificationColor } from './canopy-formatters'

function relatedLabel(role: CanopyTaskDetail['related_tasks'][number]['relationship_role']): string {
  switch (role) {
    case 'follow_up_parent':
      return 'parent'
    case 'follow_up_child':
      return 'follow-up'
    case 'blocked_by':
      return 'blocked by'
    case 'blocks':
      return 'blocking'
    default:
      return role
  }
}

export function TaskRelatedTasksSection({
  onOpenTask,
  relatedTasks,
}: {
  onOpenTask: (taskId: string) => void
  relatedTasks: CanopyTaskDetail['related_tasks']
}) {
  if (relatedTasks.length === 0) {
    return null
  }

  return (
    <Stack gap='xs'>
      <Text fw={600}>Related tasks</Text>
      {relatedTasks.map((item) => (
        <Stack
          gap={4}
          key={`${item.relationship_id}:${item.related_task_id}`}
        >
          <Group gap='xs'>
            <Badge
              color='grape'
              variant='outline'
            >
              {relatedLabel(item.relationship_role)}
            </Badge>
            <Badge
              color={statusColor(item.status)}
              variant='light'
            >
              {item.status}
            </Badge>
            <Badge
              color={verificationColor(item.verification_state)}
              variant='outline'
            >
              verify {item.verification_state}
            </Badge>
          </Group>
          <Anchor
            component='button'
            onClick={() => onOpenTask(item.related_task_id)}
            style={{ textAlign: 'left' }}
            type='button'
          >
            {item.title}
          </Anchor>
          <Text
            c='dimmed'
            size='sm'
          >
            {item.owner_agent_id ? `Owner ${item.owner_agent_id}` : 'Unassigned'}
            {item.blocked_reason ? ` · Blocked: ${item.blocked_reason}` : ''}
          </Text>
        </Stack>
      ))}
    </Stack>
  )
}
