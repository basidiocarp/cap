import { Badge, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconCircleCheck, IconHistory, IconSearch } from '@tabler/icons-react'

import type { SessionTimelineEntry } from '../../lib/types'
import { timeAgo } from '../../lib/time'
import { eventColor } from './session-utils'

function eventIcon(event: SessionTimelineEntry) {
  if (event.kind === 'recall') return <IconSearch size={14} />
  if (event.signal_type === 'session_success' || event.signal_type === 'build_passed' || event.signal_type === 'test_passed') {
    return <IconCircleCheck size={14} />
  }
  return <IconHistory size={14} />
}

export function SessionEventRow({ event }: { event: SessionTimelineEntry }) {
  return (
    <Group
      align='flex-start'
      gap='sm'
      wrap='nowrap'
    >
      <ThemeIcon
        color={eventColor(event)}
        mt={2}
        radius='xl'
        size='md'
        variant='light'
      >
        {eventIcon(event)}
      </ThemeIcon>

      <Stack
        gap={2}
        style={{ flex: 1 }}
      >
        <Group
          gap='xs'
          justify='space-between'
        >
          <Text
            fw={500}
            size='sm'
          >
            {event.title}
          </Text>
          <Text
            c='dimmed'
            size='xs'
          >
            {timeAgo(event.occurred_at, { allowMonths: true })}
          </Text>
        </Group>

        {event.detail ? (
          <Text
            c='dimmed'
            size='sm'
          >
            {event.detail}
          </Text>
        ) : null}

        <Group gap='xs'>
          <Badge
            color={eventColor(event)}
            size='xs'
            variant='light'
          >
            {event.kind}
          </Badge>
          {event.memory_count != null ? (
            <Badge
              color='gray'
              size='xs'
              variant='outline'
            >
              {event.memory_count} {event.memory_count === 1 ? 'memory' : 'memories'}
            </Badge>
          ) : null}
          {event.signal_type ? (
            <Badge
              color='gray'
              size='xs'
              variant='outline'
            >
              {event.signal_type}
            </Badge>
          ) : null}
        </Group>
      </Stack>
    </Group>
  )
}
