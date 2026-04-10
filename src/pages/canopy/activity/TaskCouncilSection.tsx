import { Badge, Divider, Group, Stack, Text } from '@mantine/core'

import type { CanopyTaskDetail } from '../../../lib/api'
import { EmptyState } from '../../../components/EmptyState'
import { SectionCard } from '../../../components/SectionCard'
import { timeAgo } from '../../../lib/time'
import { formatLabel } from '../canopy-formatters'
import { buildCouncilSessionViewModel } from '../council-session'

export function TaskCouncilSection({ detail }: { detail: CanopyTaskDetail }) {
  const councilSession = buildCouncilSessionViewModel(detail)

  return (
    <>
      <Divider label='Council session' />
      {councilSession ? (
        <Stack gap='xs'>
          <SectionCard p='sm'>
            <Stack gap={4}>
              <Group gap='xs'>
                <Badge
                  color={councilSession.state === 'open' ? 'yellow' : 'gray'}
                  size='xs'
                  variant='light'
                >
                  {councilSession.state}
                </Badge>
                <Badge
                  color={councilSession.source === 'backend' ? 'green' : 'blue'}
                  size='xs'
                  variant='outline'
                >
                  {councilSession.source === 'backend' ? 'task-linked' : 'derived'}
                </Badge>
                <Text
                  c='dimmed'
                  size='sm'
                >
                  Task {councilSession.task_id}
                </Text>
                {councilSession.worktree_id ? (
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    Worktree {councilSession.worktree_id}
                  </Text>
                ) : null}
              </Group>
              <Text size='sm'>{councilSession.summary ?? 'Council session ready for review.'}</Text>
              {councilSession.council_session_id ? (
                <Group gap='xs'>
                  <Badge
                    color='grape'
                    size='xs'
                    variant='outline'
                  >
                    session {councilSession.council_session_id}
                  </Badge>
                </Group>
              ) : null}
              {councilSession.transcript_ref ? (
                <Text
                  c='dimmed'
                  size='sm'
                >
                  Transcript {councilSession.transcript_ref}
                </Text>
              ) : null}
            </Stack>
          </SectionCard>

          <SectionCard
            p='sm'
            title='Roster'
          >
            <Stack gap='xs'>
              {councilSession.roster.map((participant) => (
                <Group
                  justify='space-between'
                  key={participant.role}
                >
                  <Group gap='xs'>
                    <Badge
                      color='indigo'
                      size='xs'
                      variant='light'
                    >
                      {participant.role}
                    </Badge>
                    <Text size='sm'>{participant.agent_id ?? 'pending'}</Text>
                  </Group>
                  <Badge
                    color={participant.status === 'pending' ? 'gray' : 'green'}
                    size='xs'
                    variant='outline'
                  >
                    {participant.status}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard
            p='sm'
            title='Timeline / outputs'
          >
            <Stack gap='xs'>
              {councilSession.timeline.map((entry) => (
                <Stack
                  gap={4}
                  key={`${entry.kind}-${entry.title}-${entry.body}`}
                >
                  <Group gap='xs'>
                    <Badge
                      color='blue'
                      size='xs'
                      variant='light'
                    >
                      {formatLabel(entry.kind)}
                    </Badge>
                    <Text fw={500}>{entry.title}</Text>
                    {entry.created_at ? (
                      <Text
                        c='dimmed'
                        size='xs'
                      >
                        {timeAgo(entry.created_at, { allowMonths: true })}
                      </Text>
                    ) : null}
                  </Group>
                  <Text size='sm'>{entry.body}</Text>
                  {entry.author_agent_id ? (
                    <Text
                      c='dimmed'
                      size='sm'
                    >
                      Author {entry.author_agent_id}
                    </Text>
                  ) : null}
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Stack>
      ) : (
        <EmptyState>No council session is attached to this task yet.</EmptyState>
      )}
    </>
  )
}
