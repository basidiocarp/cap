import { Alert, Badge, Card, Grid, Group, Loader, Progress, Stack, Table, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'

import type { HealthResult, Stats, TopicSummary } from '../lib/api'

import { hyphaeApi, myceliumApi } from '../lib/api'

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [topics, setTopics] = useState<TopicSummary[]>([])
  const [health, setHealth] = useState<HealthResult[]>([])
  const [gain, setGain] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [s, t, h, g] = await Promise.allSettled([
          hyphaeApi.stats(),
          hyphaeApi.topics(),
          hyphaeApi.health(),
          myceliumApi.gain(),
        ])
        if (s.status === 'fulfilled') setStats(s.value)
        if (t.status === 'fulfilled') setTopics(t.value)
        if (h.status === 'fulfilled') setHealth(h.value)
        if (g.status === 'fulfilled') setGain(g.value as Record<string, unknown>)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <Group justify='center' mt='xl'>
        <Loader />
      </Group>
    )
  }

  if (error) {
    return <Alert color='red' title='Error'>{error}</Alert>
  }

  return (
    <Stack>
      <Title order={2}>Dashboard</Title>

      {stats && (
        <Grid>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card padding='lg' shadow='sm' withBorder>
              <Text c='dimmed' size='xs'>Memories</Text>
              <Title order={3}>{stats.total_memories}</Title>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card padding='lg' shadow='sm' withBorder>
              <Text c='dimmed' size='xs'>Topics</Text>
              <Title order={3}>{stats.total_topics}</Title>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card padding='lg' shadow='sm' withBorder>
              <Text c='dimmed' size='xs'>Avg Weight</Text>
              <Title order={3}>{stats.avg_weight?.toFixed(3) ?? '—'}</Title>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 3 }}>
            <Card padding='lg' shadow='sm' withBorder>
              <Text c='dimmed' size='xs'>Token Savings</Text>
              <Title order={3}>
                {gain && typeof gain.avg_savings_pct === 'number' ? `${(gain.avg_savings_pct as number).toFixed(1)}%` : '—'}
              </Title>
            </Card>
          </Grid.Col>
        </Grid>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card padding='lg' shadow='sm' withBorder>
            <Title mb='sm' order={4}>Topics</Title>
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
              <Text c='dimmed' size='sm'>No topics yet</Text>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card padding='lg' shadow='sm' withBorder>
            <Title mb='sm' order={4}>Memory Health</Title>
            {health.length > 0 ? (
              <Stack gap='sm'>
                {health.map((h) => (
                  <div key={h.topic}>
                    <Group justify='space-between' mb={4}>
                      <Text size='sm'>{h.topic}</Text>
                      <Group gap='xs'>
                        {h.critical_count > 0 && <Badge color='red' size='xs'>{h.critical_count} critical</Badge>}
                        {h.high_count > 0 && <Badge color='orange' size='xs'>{h.high_count} high</Badge>}
                        {h.low_weight_count > 0 && <Badge color='yellow' size='xs'>{h.low_weight_count} fading</Badge>}
                      </Group>
                    </Group>
                    <Progress color={h.avg_weight > 0.7 ? 'green' : h.avg_weight > 0.4 ? 'yellow' : 'red'} value={h.avg_weight * 100} />
                  </div>
                ))}
              </Stack>
            ) : (
              <Text c='dimmed' size='sm'>No health data</Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
