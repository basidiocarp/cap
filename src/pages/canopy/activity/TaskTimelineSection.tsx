import { Badge, Divider, Group, Stack, Text } from '@mantine/core'

import type { CanopyTaskDetail } from '../../../lib/api'
import { EmptyState } from '../../../components/EmptyState'
import { SectionCard } from '../../../components/SectionCard'
import { timeAgo } from '../../../lib/time'
import { eventTitle, statusColor, verificationColor } from '../canopy-formatters'

export function TaskTimelineSection({ events }: { events: CanopyTaskDetail['events'] }) {
  return (
    <>
      <Divider label='Timeline' />
      {events.length > 0 ? (
        <Stack gap='sm'>
          {events.map((event) => (
            <SectionCard
              key={event.event_id}
              p='sm'
            >
              <Stack gap={4}>
                <Group justify='space-between'>
                  <Text fw={600}>{eventTitle(event)}</Text>
                  <Text
                    c='dimmed'
                    size='xs'
                  >
                    {timeAgo(event.created_at, { allowMonths: true })}
                  </Text>
                </Group>
                <Group gap='xs'>
                  <Badge
                    color={statusColor(event.to_status)}
                    size='xs'
                    variant='light'
                  >
                    {event.to_status}
                  </Badge>
                  {event.verification_state ? (
                    <Badge
                      color={verificationColor(event.verification_state)}
                      size='xs'
                      variant='outline'
                    >
                      {event.verification_state}
                    </Badge>
                  ) : null}
                </Group>
                <Text size='sm'>Actor: {event.actor}</Text>
                {event.from_status ? (
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    From {event.from_status}
                  </Text>
                ) : null}
                {event.owner_agent_id ? (
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    Owner {event.owner_agent_id}
                  </Text>
                ) : null}
                {event.note ? <Text size='sm'>{event.note}</Text> : null}
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      ) : (
        <EmptyState>No lifecycle events recorded for this task yet.</EmptyState>
      )}
    </>
  )
}
