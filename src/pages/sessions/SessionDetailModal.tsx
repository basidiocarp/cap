import { Badge, Code, Group, Modal, ScrollArea, Stack, Text } from '@mantine/core'

import type { CommandHistoryEntry, SessionTimelineRecord } from '../../lib/types'
import { SectionCard } from '../../components/SectionCard'
import { SessionEventRow } from './SessionEventRow'
import { formatDuration, parseJsonCount, parseJsonStrings, statusColor } from './session-utils'

export function SessionDetailModal({
  commands,
  onClose,
  session,
}: {
  commands: CommandHistoryEntry[]
  onClose: () => void
  session: SessionTimelineRecord
}) {
  const files = parseJsonStrings(session.files_modified)
  const errors = parseJsonStrings(session.errors)
  const errorCount = parseJsonCount(session.errors)

  return (
    <Modal
      centered
      onClose={onClose}
      opened
      size='xl'
      title={
        <Group gap='sm'>
          <Text fw={600}>{session.task || 'Untitled Session'}</Text>
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
      }
    >
      <ScrollArea.Autosize mah='70vh'>
        <Stack gap='md'>
          <Group gap='xs'>
            <Badge
              color='gray'
              size='sm'
              variant='outline'
            >
              {session.project}
            </Badge>
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
          </Group>

          {session.summary ? (
            <SectionCard
              padding='sm'
              title='Summary'
            >
              <Text size='sm'>{session.summary}</Text>
            </SectionCard>
          ) : null}

          <SectionCard
            padding='sm'
            title='Timing'
          >
            <Stack gap='xs'>
              <Text size='sm'>Started: {new Date(session.started_at).toLocaleString()}</Text>
              <Text size='sm'>Last activity: {new Date(session.last_activity_at).toLocaleString()}</Text>
              <Text size='sm'>Ended: {session.ended_at ? new Date(session.ended_at).toLocaleString() : 'In progress'}</Text>
              <Text size='sm'>Duration: {formatDuration(session.started_at, session.ended_at)}</Text>
            </Stack>
          </SectionCard>

          {files.length > 0 ? (
            <SectionCard
              padding='sm'
              title={`Files Modified (${files.length})`}
            >
              <Stack gap='xs'>
                {files.map((file) => (
                  <Code
                    block
                    key={file}
                  >
                    {file}
                  </Code>
                ))}
              </Stack>
            </SectionCard>
          ) : null}

          {errorCount > 0 ? (
            <SectionCard
              padding='sm'
              title={`Errors (${errorCount})`}
            >
              {errors.length > 0 ? (
                <Stack gap='xs'>
                  {errors.map((error) => (
                    <Code
                      block
                      key={error}
                    >
                      {error}
                    </Code>
                  ))}
                </Stack>
              ) : (
                <Text
                  c='dimmed'
                  size='sm'
                >
                  {errorCount} recorded errors were attached to this session without individual detail payloads.
                </Text>
              )}
            </SectionCard>
          ) : null}

          <SectionCard
            padding='sm'
            title={`Activity (${session.events.length})`}
          >
            <Stack gap='sm'>
              {session.events.length > 0 ? (
                session.events.map((event) => (
                  <SessionEventRow
                    event={event}
                    key={event.id}
                  />
                ))
              ) : (
                <Text
                  c='dimmed'
                  size='sm'
                >
                  No structured recall or outcome events are attached to this session yet.
                </Text>
              )}
            </Stack>
          </SectionCard>

          <SectionCard
            padding='sm'
            title={`Mycelium Commands (${commands.length})`}
          >
            <Stack gap='sm'>
              {commands.length > 0 ? (
                commands.map((command) => (
                  <Group
                    align='flex-start'
                    gap='xs'
                    justify='space-between'
                    key={`${command.timestamp}-${command.command}`}
                  >
                    <Stack gap={2}>
                      <Code block>{command.command}</Code>
                      <Text
                        c='dimmed'
                        size='xs'
                      >
                        {new Date(command.timestamp).toLocaleString()}
                      </Text>
                    </Stack>
                    <Stack
                      align='flex-end'
                      gap={2}
                    >
                      <Badge
                        color='mycelium'
                        size='sm'
                        variant='light'
                      >
                        {command.savings_pct.toFixed(0)}%
                      </Badge>
                      <Text size='xs'>{command.saved_tokens.toLocaleString()} tokens saved</Text>
                    </Stack>
                  </Group>
                ))
              ) : (
                <Text
                  c='dimmed'
                  size='sm'
                >
                  No Mycelium commands were recorded inside this session window.
                </Text>
              )}
            </Stack>
          </SectionCard>
        </Stack>
      </ScrollArea.Autosize>
    </Modal>
  )
}
