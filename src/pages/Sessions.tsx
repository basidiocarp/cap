import { Badge, Card, Group, Stack, Text, Title } from '@mantine/core'
import { IconClock, IconFiles, IconAlertCircle } from '@tabler/icons-react'

import type { SessionRecord } from '../lib/types'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { useSessions } from '../lib/queries'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

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
          justify='space-between'
          align='flex-start'
        >
          <Stack gap={4}>
            <Group gap='xs'>
              <Title
                order={4}
                fw={600}
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
                size='sm'
                lineClamp={2}
              >
                {session.summary}
              </Text>
            )}
          </Stack>
          <Text
            c='dimmed'
            size='sm'
            fw={500}
          >
            {timeAgo(session.started_at)}
          </Text>
        </Group>

        <Group gap='lg'>
          <Group
            gap={4}
            c='dimmed'
          >
            <IconClock size={16} />
            <Text size='sm'>{formatDuration(session.started_at, session.ended_at)}</Text>
          </Group>

          {filesCount > 0 && (
            <Group
              gap={4}
              c='dimmed'
            >
              <IconFiles size={16} />
              <Text size='sm'>{filesCount} files modified</Text>
            </Group>
          )}

          {errorCount > 0 && (
            <Group
              gap={4}
              c='red'
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
        title='Failed to load sessions'
        error={sessionsQuery.error}
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
