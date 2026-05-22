import { Badge, Group, Paper, ScrollArea, SimpleGrid, Stack, Text, Title } from '@mantine/core'

import type { SnapshotCard } from '../../lib/types/snapshot'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { useSnapshot } from '../../lib/queries/snapshot'

const KANBAN_COLUMNS = ['To Do', 'In Progress', 'In Review', 'Done']

function CardItem({ card }: { card: SnapshotCard }) {
  return (
    <Paper
      p='sm'
      withBorder
    >
      <Stack gap='xs'>
        <Text
          fw={500}
          size='sm'
        >
          {card.title}
        </Text>
        <Group gap='xs'>
          <Badge
            color='gray'
            size='xs'
            variant='outline'
          >
            {card.repo}
          </Badge>
          <Badge
            color='blue'
            size='xs'
            variant='light'
          >
            {card.priority}
          </Badge>
        </Group>
        <Text
          c='dimmed'
          size='xs'
        >
          {card.status}
        </Text>
      </Stack>
    </Paper>
  )
}

function KanbanColumn({ title, cards }: { title: string; cards: SnapshotCard[] }) {
  return (
    <Stack gap='sm'>
      <Group justify='space-between'>
        <Title order={5}>{title}</Title>
        <Badge
          color='gray'
          variant='light'
        >
          {cards.length}
        </Badge>
      </Group>
      <ScrollArea h={600}>
        <Stack gap='sm'>
          {cards.map((card) => (
            <CardItem
              card={card}
              key={card.id}
            />
          ))}
          {cards.length === 0 && (
            <Text
              c='dimmed'
              size='sm'
              ta='center'
            >
              Empty
            </Text>
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  )
}

export function SnapshotPage() {
  const { data: snapshot, isError, isLoading } = useSnapshot()

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorAlert error={new Error('Failed to load snapshot')} />

  return (
    <Stack
      gap='lg'
      p='md'
    >
      <Group justify='space-between'>
        <Title order={2}>Task Snapshot</Title>
        {snapshot?.generated_at && (
          <Text
            c='dimmed'
            size='sm'
          >
            Generated {new Date(snapshot.generated_at).toLocaleString()}
          </Text>
        )}
      </Group>
      {snapshot?.focus && (
        <Paper
          p='md'
          withBorder
        >
          <Stack gap='xs'>
            <Text
              fw={600}
              size='sm'
            >
              Focus
            </Text>
            <Text>{snapshot.focus.title}</Text>
            <Group gap='xs'>
              <Badge
                color='gray'
                size='sm'
                variant='outline'
              >
                {snapshot.focus.repo}
              </Badge>
              <Badge
                color='blue'
                size='sm'
                variant='light'
              >
                {snapshot.focus.priority}
              </Badge>
            </Group>
          </Stack>
        </Paper>
      )}
      <SimpleGrid
        cols={4}
        spacing='md'
      >
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            cards={snapshot?.columns[col] ?? []}
            key={col}
            title={col}
          />
        ))}
      </SimpleGrid>
      {snapshot?.journal && snapshot.journal.length > 0 ? (
        <Stack gap='sm'>
          <Title order={4}>Recent Activity</Title>
          {snapshot.journal.map((entry) => (
            <Text
              c='dimmed'
              key={`${entry.at}-${entry.card_id}`}
              size='sm'
            >
              {entry.at} — {entry.card_id}: {entry.from_status} → {entry.to_status}
              {entry.note ? ` (${entry.note})` : ''}
            </Text>
          ))}
        </Stack>
      ) : (
        <Text
          c='dimmed'
          size='sm'
        >
          No recent activity.
        </Text>
      )}
    </Stack>
  )
}
