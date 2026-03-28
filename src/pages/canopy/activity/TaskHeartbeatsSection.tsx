import { Badge, Divider, Group, Stack, Text } from '@mantine/core'

import type { CanopyTaskDetail } from '../../../lib/api'
import { EmptyState } from '../../../components/EmptyState'
import { SectionCard } from '../../../components/SectionCard'
import { timeAgo } from '../../../lib/time'
import { heartbeatSourceLabel } from '../canopy-formatters'

export function TaskHeartbeatsSection({ heartbeats }: { heartbeats: CanopyTaskDetail['heartbeats'] }) {
  return (
    <>
      <Divider label='Heartbeats' />
      {heartbeats.length > 0 ? (
        <Stack gap='xs'>
          {heartbeats.map((heartbeat) => (
            <SectionCard
              key={heartbeat.heartbeat_id}
              p='sm'
            >
              <Stack gap={4}>
                <Group justify='space-between'>
                  <Group gap='xs'>
                    <Badge
                      color='blue'
                      size='xs'
                      variant='light'
                    >
                      {heartbeat.status}
                    </Badge>
                    <Badge
                      color='gray'
                      size='xs'
                      variant='outline'
                    >
                      {heartbeatSourceLabel(heartbeat.source)}
                    </Badge>
                  </Group>
                  <Text
                    c='dimmed'
                    size='xs'
                  >
                    {timeAgo(heartbeat.created_at, { allowMonths: true })}
                  </Text>
                </Group>
                <Text size='sm'>Agent: {heartbeat.agent_id}</Text>
                {heartbeat.current_task_id ? (
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    Current task {heartbeat.current_task_id}
                  </Text>
                ) : null}
                {heartbeat.related_task_id ? (
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    Related task {heartbeat.related_task_id}
                  </Text>
                ) : null}
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      ) : (
        <EmptyState>No heartbeat history recorded for this task yet.</EmptyState>
      )}
    </>
  )
}
