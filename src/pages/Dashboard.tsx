import { Badge, Card, Grid, Group, Loader, Progress, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useQueries } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { ContextEntry, GatherContextResult, HealthResult, Stats, TopicSummary } from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { KpiCard } from '../components/KpiCard'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { hyphaeApi, myceliumApi } from '../lib/api'
import { hyphaeKeys, myceliumKeys, useContext, useEcosystemStatus } from '../lib/queries'

function relevanceColor(score: number): string {
  if (score >= 0.8) return 'mycelium'
  if (score >= 0.5) return 'fruiting'
  return 'substrate'
}

function sourceLabel(source: string): string {
  switch (source) {
    case 'memory':
      return 'Memory'
    case 'error':
      return 'Error'
    case 'session':
      return 'Session'
    case 'code':
      return 'Code'
    default:
      return source
  }
}

function ContextCard({ entry }: { entry: ContextEntry }) {
  return (
    <Card
      p='sm'
      withBorder
    >
      <Group
        justify='space-between'
        mb={4}
      >
        <Group gap='xs'>
          <Badge
            color={relevanceColor(entry.relevance)}
            size='xs'
            variant='light'
          >
            {sourceLabel(entry.source)}
          </Badge>
          {entry.topic && (
            <Text
              c='dimmed'
              size='xs'
            >
              {entry.topic}
            </Text>
          )}
          {entry.symbol && (
            <Text
              ff='monospace'
              size='xs'
            >
              {entry.symbol}
            </Text>
          )}
        </Group>
        <Text
          c='dimmed'
          size='xs'
        >
          {(entry.relevance * 100).toFixed(0)}%
        </Text>
      </Group>
      <Text size='sm'>{entry.content.length > 200 ? `${entry.content.slice(0, 200)}...` : entry.content}</Text>
    </Card>
  )
}

function QuickContext() {
  const [task, setTask] = useState('')
  const [debouncedTask] = useDebouncedValue(task, 500)
  const contextQuery = useContext(debouncedTask)
  const data = contextQuery.data as GatherContextResult | undefined

  return (
    <SectionCard title='Quick Context'>
      <TextInput
        mb='sm'
        onChange={(e) => setTask(e.currentTarget.value)}
        placeholder='Describe a task to gather context for...'
        value={task}
      />
      {contextQuery.isLoading && debouncedTask && <Loader size='sm' />}
      {data && data.context.length > 0 && (
        <Stack gap='xs'>
          {data.context.map((entry) => (
            <ContextCard
              entry={entry}
              key={`${entry.source}-${entry.topic ?? ''}-${entry.symbol ?? ''}-${entry.content.slice(0, 32)}`}
            />
          ))}
          <Text
            c='dimmed'
            size='xs'
          >
            {data.tokens_used}/{data.tokens_budget} tokens | Sources: {data.sources_queried.join(', ')}
          </Text>
        </Stack>
      )}
      {data && data.context.length === 0 && debouncedTask && (
        <Text
          c='dimmed'
          size='sm'
        >
          No relevant context found.
        </Text>
      )}
    </SectionCard>
  )
}

export function Dashboard() {
  const navigate = useNavigate()

  const [statsQuery, topicsQuery, healthQuery, gainQuery] = useQueries({
    queries: [
      { queryFn: () => hyphaeApi.stats(), queryKey: hyphaeKeys.stats() },
      { queryFn: () => hyphaeApi.topics(), queryKey: hyphaeKeys.topics() },
      { queryFn: () => hyphaeApi.health(), queryKey: hyphaeKeys.health() },
      { queryFn: () => myceliumApi.gain(), queryKey: myceliumKeys.gain() },
    ],
  })

  const { data: ecosystemStatus } = useEcosystemStatus()

  const loading = statsQuery.isLoading || topicsQuery.isLoading || healthQuery.isLoading || gainQuery.isLoading
  const error = statsQuery.error || topicsQuery.error || healthQuery.error || gainQuery.error

  const stats = statsQuery.data as Stats | undefined
  const topics = (topicsQuery.data ?? []) as TopicSummary[]
  const health = (healthQuery.data ?? []) as HealthResult[]
  const gain = gainQuery.data as Record<string, unknown> | undefined

  if (loading) {
    return <PageLoader />
  }

  if (error) {
    return <ErrorAlert error={error instanceof Error ? error : new Error('Failed to load')} />
  }

  return (
    <Stack>
      <Title order={2}>Dashboard</Title>

      {ecosystemStatus && (
        <Group gap='xs'>
          <Badge
            color={ecosystemStatus.mycelium.available ? 'mycelium' : 'red'}
            variant='light'
          >
            Mycelium {ecosystemStatus.mycelium.available ? '✓' : '✗'}
          </Badge>
          <Badge
            color={ecosystemStatus.hyphae.available ? 'substrate' : 'red'}
            variant='light'
          >
            Hyphae {ecosystemStatus.hyphae.available ? '✓' : '✗'}
          </Badge>
          <Badge
            color={ecosystemStatus.rhizome.available ? 'fruiting' : 'red'}
            variant='light'
          >
            Rhizome {ecosystemStatus.rhizome.available ? '✓' : '✗'}
          </Badge>
        </Group>
      )}

      {stats && (
        <Grid>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <KpiCard
              accent='mycelium.7'
              label='Memories'
              value={String(stats.total_memories)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <KpiCard
              accent='spore.6'
              label='Topics'
              value={String(stats.total_topics)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <KpiCard
              accent='substrate.6'
              label='Avg Weight'
              value={stats.avg_weight?.toFixed(3) ?? '\u2014'}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <KpiCard
              accent='fruiting.6'
              label='Token Savings'
              value={gain && typeof gain.avg_savings_pct === 'number' ? `${(gain.avg_savings_pct as number).toFixed(1)}%` : '\u2014'}
            />
          </Grid.Col>
        </Grid>
      )}

      <QuickContext />

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <SectionCard
            h='100%'
            title='Topics'
          >
            {topics.length > 0 ? (
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Topic</Table.Th>
                    <Table.Th>Count</Table.Th>
                    <Table.Th>Avg Weight</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {topics.map((t) => (
                    <Table.Tr key={t.topic}>
                      <Table.Td>
                        <Text
                          component='button'
                          fw={500}
                          onClick={() => navigate(`/memories?topic=${encodeURIComponent(t.topic)}`)}
                          style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
                          variant='link'
                        >
                          {t.topic}
                        </Text>
                      </Table.Td>
                      <Table.Td>{t.count}</Table.Td>
                      <Table.Td>{t.avg_weight.toFixed(3)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <EmptyState>No topics yet</EmptyState>
            )}
          </SectionCard>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <SectionCard
            h='100%'
            title='Memory Health'
          >
            {health.length > 0 ? (
              <Stack gap='sm'>
                {health.map((h) => (
                  <div key={h.topic}>
                    <Group
                      justify='space-between'
                      mb={4}
                    >
                      <Text size='sm'>{h.topic}</Text>
                      <Group gap='xs'>
                        {h.critical_count > 0 && (
                          <Badge
                            color='gill'
                            size='xs'
                            variant='light'
                          >
                            {h.critical_count} critical
                          </Badge>
                        )}
                        {h.high_count > 0 && (
                          <Badge
                            color='fruiting'
                            size='xs'
                            variant='light'
                          >
                            {h.high_count} high
                          </Badge>
                        )}
                        {h.low_weight_count > 0 && (
                          <Badge
                            color='substrate'
                            size='xs'
                            variant='light'
                          >
                            {h.low_weight_count} fading
                          </Badge>
                        )}
                      </Group>
                    </Group>
                    <Progress
                      color={h.avg_weight > 0.7 ? 'mycelium' : h.avg_weight > 0.4 ? 'substrate' : 'decay'}
                      value={h.avg_weight * 100}
                    />
                  </div>
                ))}
              </Stack>
            ) : (
              <EmptyState>No health data</EmptyState>
            )}
          </SectionCard>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
