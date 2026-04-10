import { Badge, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import {
  IconAlertCircle,
  IconArrowBackUp,
  IconBook2,
  IconCircleCheck,
  IconCircleX,
  IconFileExport,
  IconFileText,
  IconSearch,
} from '@tabler/icons-react'

import type { SessionTimelineEntry } from '../../lib/types'
import { timeAgo } from '../../lib/time'
import { eventColor, getTimelineEventTimestamp, getTimelineEventType, timelineEventLabel } from './session-utils'

function eventIcon(type: ReturnType<typeof getTimelineEventType>) {
  switch (type) {
    case 'recall':
      return <IconBook2 size={14} />
    case 'error':
      return <IconCircleX size={14} />
    case 'correction':
      return <IconArrowBackUp size={14} />
    case 'test_pass':
      return <IconCircleCheck size={14} />
    case 'test_fail':
      return <IconAlertCircle size={14} />
    case 'export':
      return <IconFileExport size={14} />
    case 'summary':
      return <IconFileText size={14} />
    default:
      return <IconSearch size={14} />
  }
}

export function SessionEventRow({ event }: { event: SessionTimelineEntry }) {
  const type = getTimelineEventType(event)
  const timestamp = getTimelineEventTimestamp(event)
  const headline = event.content ?? event.title
  const detail = event.content && event.content !== event.title ? (event.detail ?? null) : event.detail

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
        {eventIcon(type)}
      </ThemeIcon>

      <Stack
        gap={3}
        style={{ flex: 1 }}
      >
        <Group
          gap='xs'
          justify='space-between'
          wrap='nowrap'
        >
          <Group
            gap='xs'
            wrap='nowrap'
          >
            <Text
              fw={600}
              size='sm'
            >
              {timelineEventLabel(type)}
            </Text>
            <Badge
              color={eventColor(event)}
              size='xs'
              variant='light'
            >
              {type}
            </Badge>
          </Group>
          <Text
            c='dimmed'
            size='xs'
          >
            {timeAgo(timestamp, { allowMonths: true })}
          </Text>
        </Group>

        <Text
          fw={500}
          size='sm'
        >
          {headline}
        </Text>

        {detail ? (
          <Text
            c='dimmed'
            size='sm'
          >
            {detail}
          </Text>
        ) : null}

        <Group gap='xs'>
          {event.score != null ? (
            <Badge
              color={eventColor(event)}
              size='xs'
              variant='outline'
            >
              Score {event.score}
            </Badge>
          ) : null}
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
          {event.source ? (
            <Badge
              color='gray'
              size='xs'
              variant='outline'
            >
              {event.source}
            </Badge>
          ) : null}
        </Group>
      </Stack>
    </Group>
  )
}
