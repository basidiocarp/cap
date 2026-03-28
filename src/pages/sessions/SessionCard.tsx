import { Badge, Button, Card, Divider, Group, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconClock, IconFiles } from '@tabler/icons-react'

import type { CommandHistoryEntry, SessionTimelineRecord } from '../../lib/types'
import { timeAgo } from '../../lib/time'
import { SessionEventRow } from './SessionEventRow'
import { formatDuration, parseJsonCount, statusColor } from './session-utils'

export function SessionCard({
  commands,
  onOpenDetail,
  session,
}: {
  commands: CommandHistoryEntry[]
  onOpenDetail: () => void
  session: SessionTimelineRecord
}) {
  const filesCount = parseJsonCount(session.files_modified)
  const errorCount = parseJsonCount(session.errors)
  const visibleEvents = session.events.slice(0, 8)
  const visibleCommands = commands.slice(0, 3)

  return (
    <Card
      p='md'
      withBorder
    >
      <Stack gap='sm'>
        <Group
          align='flex-start'
          justify='space-between'
        >
          <Stack gap={4}>
            <Group gap='xs'>
              <Title
                fw={600}
                order={4}
              >
                {session.task || 'Untitled Session'}
              </Title>
              <Badge
                color={statusColor(session.status)}
                size='sm'
                variant='light'
              >
                {session.status}
              </Badge>
              {session.scope ? (
                <Badge
                  color='gray'
                  size='sm'
                  variant='outline'
                >
                  {session.scope}
                </Badge>
              ) : null}
            </Group>
            <Text
              c='dimmed'
              size='sm'
            >
              {session.project}
            </Text>
            {session.summary ? (
              <Text
                c='dimmed'
                lineClamp={2}
                size='sm'
              >
                {session.summary}
              </Text>
            ) : null}
          </Stack>
          <Text
            c='dimmed'
            fw={500}
            size='sm'
          >
            {timeAgo(session.last_activity_at, { allowMonths: true })}
          </Text>
        </Group>

        <Group gap='lg'>
          <Group
            c='dimmed'
            gap={4}
          >
            <IconClock size={16} />
            <Text size='sm'>{formatDuration(session.started_at, session.ended_at)}</Text>
          </Group>

          {filesCount > 0 ? (
            <Group
              c='dimmed'
              gap={4}
            >
              <IconFiles size={16} />
              <Text size='sm'>{filesCount} files modified</Text>
            </Group>
          ) : null}

          {errorCount > 0 ? (
            <Group
              c='red'
              gap={4}
            >
              <IconAlertCircle size={16} />
              <Text size='sm'>{errorCount} errors</Text>
            </Group>
          ) : null}

          <Badge
            color='blue'
            size='sm'
            variant='light'
          >
            {session.recall_count} recalls
          </Badge>
          <Badge
            color='green'
            size='sm'
            variant='light'
          >
            {session.outcome_count} outcomes
          </Badge>
          <Button
            onClick={onOpenDetail}
            size='xs'
            variant='subtle'
          >
            View details
          </Button>
        </Group>

        {session.events.length > 0 ? (
          <>
            <Divider />
            <Stack gap='xs'>
              <Text
                fw={500}
                size='sm'
              >
                Activity
              </Text>
              {visibleEvents.map((event) => (
                <SessionEventRow
                  event={event}
                  key={event.id}
                />
              ))}
              {session.events.length > visibleEvents.length ? (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Showing the most recent {visibleEvents.length} of {session.events.length} events.
                </Text>
              ) : null}
            </Stack>
          </>
        ) : (
          <Text
            c='dimmed'
            size='sm'
          >
            No structured recall or outcome events are attached to this session yet.
          </Text>
        )}

        {visibleCommands.length > 0 ? (
          <>
            <Divider />
            <Stack gap='xs'>
              <Text
                fw={500}
                size='sm'
              >
                Mycelium Commands
              </Text>
              {visibleCommands.map((command) => (
                <Group
                  gap='xs'
                  justify='space-between'
                  key={`${command.timestamp}-${command.command}`}
                >
                  <Stack gap={2}>
                    <Text
                      ff='monospace'
                      size='sm'
                    >
                      {command.command}
                    </Text>
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      {command.saved_tokens.toLocaleString()} tokens saved
                    </Text>
                  </Stack>
                  <Group gap='xs'>
                    <Badge
                      color='mycelium'
                      size='sm'
                      variant='light'
                    >
                      {command.savings_pct.toFixed(0)}%
                    </Badge>
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      {timeAgo(command.timestamp, { allowMonths: true })}
                    </Text>
                  </Group>
                </Group>
              ))}
              {commands.length > visibleCommands.length ? (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Showing the most recent {visibleCommands.length} of {commands.length} Mycelium commands in this session window.
                </Text>
              ) : null}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Card>
  )
}
