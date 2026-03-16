import { Badge, Card, Grid, Group, Progress, Stack, Table, Text, Title } from '@mantine/core'
import { useQueries } from '@tanstack/react-query'

import type { HealthResult, Stats, TopicSummary } from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { hyphaeApi, myceliumApi } from '../lib/api'
import { hyphaeKeys, myceliumKeys } from '../lib/queries'

export function Dashboard() {
  const [statsQuery, topicsQuery, healthQuery, gainQuery] = useQueries({
    queries: [
      { queryFn: () => hyphaeApi.stats(), queryKey: hyphaeKeys.stats() },
      { queryFn: () => hyphaeApi.topics(), queryKey: hyphaeKeys.topics() },
      { queryFn: () => hyphaeApi.health(), queryKey: hyphaeKeys.health() },
      { queryFn: () => myceliumApi.gain(), queryKey: myceliumKeys.gain() },
    ],
  })

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

      {stats && (
        <Grid>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card
              padding='lg'
              shadow='sm'
              withBorder
            >
              <Text
                c='dimmed'
                size='xs'
              >
                Memories
              </Text>
              <Title order={3}>{stats.total_memories}</Title>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card
              padding='lg'
              shadow='sm'
              withBorder
            >
              <Text
                c='dimmed'
                size='xs'
              >
                Topics
              </Text>
              <Title order={3}>{stats.total_topics}</Title>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card
              padding='lg'
              shadow='sm'
              withBorder
            >
              <Text
                c='dimmed'
                size='xs'
              >
                Avg Weight
              </Text>
              <Title order={3}>{stats.avg_weight?.toFixed(3) ?? '—'}</Title>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card
              padding='lg'
              shadow='sm'
              withBorder
            >
              <Text
                c='dimmed'
                size='xs'
              >
                Token Savings
              </Text>
              <Title order={3}>
                {gain && typeof gain.avg_savings_pct === 'number' ? `${(gain.avg_savings_pct as number).toFixed(1)}%` : '—'}
              </Title>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <SectionCard title='Topics'>
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
                      <Table.Td>{t.topic}</Table.Td>
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
          <SectionCard title='Memory Health'>
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
                          >
                            {h.critical_count} critical
                          </Badge>
                        )}
                        {h.high_count > 0 && (
                          <Badge
                            color='fruiting'
                            size='xs'
                          >
                            {h.high_count} high
                          </Badge>
                        )}
                        {h.low_weight_count > 0 && (
                          <Badge
                            color='substrate'
                            size='xs'
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
