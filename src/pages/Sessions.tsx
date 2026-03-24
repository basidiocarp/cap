import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconClock, IconFiles } from '@tabler/icons-react'

import type { SessionRecord } from '../lib/types'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { useSessions } from '../lib/queries'
import { timeAgo } from '../lib/time'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'mycelium'
    case 'in-progress':
      return 'yellow'
    case 'failed':
    case 'error':
      return 'red'
    default:
      return 'gray'
  }
}

function formatDuration(startStr: string, endStr?: string | null): string {
  if (!endStr) return 'In progress'
  const start = new Date(startStr).getTime()
  const end = new Date(endStr).getTime()
  const diffMs = end - start
  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Card
// ─────────────────────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: SessionRecord }) {
  const filesCount = session.files_modified ? JSON.parse(session.files_modified).length : 0
  const errorCount = session.errors ? JSON.parse(session.errors).length : 0

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
            </Group>
            {session.summary && (
              <Text
                c='dimmed'
                lineClamp={2}
                size='sm'
              >
                {session.summary}
              </Text>
            )}
          </Stack>
          <Text
            c='dimmed'
            fw={500}
            size='sm'
          >
            {timeAgo(session.started_at, { allowMonths: true })}
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

          {filesCount > 0 && (
            <Group
              c='dimmed'
              gap={4}
            >
              <IconFiles size={16} />
              <Text size='sm'>{filesCount} files modified</Text>
            </Group>
          )}

          {errorCount > 0 && (
            <Group
              c='red'
              gap={4}
            >
              <IconAlertCircle size={16} />
              <Text size='sm'>{errorCount} errors</Text>
            </Group>
          )}
        </Group>
      </Stack>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function Sessions() {
  const sessionsQuery = useSessions(undefined, 50)

  if (sessionsQuery.isLoading) {
    return <PageLoader />
  }

  if (sessionsQuery.error) {
    return (
      <ErrorAlert
        error={sessionsQuery.error}
        title='Failed to load sessions'
      />
    )
  }

  const sessions = sessionsQuery.data ?? []

  return (
    <Stack gap='lg'>
      <Title order={2}>Sessions Timeline</Title>

      <SectionCard title={`Recent Sessions (${sessions.length})`}>
        {sessions.length === 0 ? (
          <Stack gap='sm'>
            <Text
              c='dimmed'
              size='sm'
            >
              No sessions found. Sessions are captured automatically during coding work.
            </Text>
          </Stack>
        ) : (
          <Stack gap='sm'>
            <Text
              c='dimmed'
              size='sm'
            >
              Past coding sessions with tasks, durations, and outcomes
            </Text>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
              />
            ))}
          </Stack>
        )}
      </SectionCard>
    </Stack>
  )
}
