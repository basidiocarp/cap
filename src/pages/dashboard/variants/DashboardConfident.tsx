import { Badge, Card, Group, Progress, SimpleGrid, Stack, Table, Text, Timeline, Title } from '@mantine/core'

import type { Anomaly } from '../../../components/AnomalyList'
import type { DashboardVariantProps } from './DashboardOperator'
import { AnomalyList } from '../../../components/AnomalyList'
import { HealthStrip } from '../../../components/HealthStrip'
import { KpiCard } from '../../../components/KpiCard'
import { SectionCard } from '../../../components/SectionCard'

export function DashboardConfident({ gain, stats, topics, health, ecosystemStatus, sessions }: DashboardVariantProps) {
  const avgSavingsPct = gain?.avg_savings_pct ?? gain?.summary?.avg_savings_pct ?? null

  const toolsStatus = [
    { name: 'mycelium', status: 'up' as const },
    { name: 'hyphae', status: 'up' as const },
    { name: 'rhizome', status: 'up' as const },
  ]

  const PLACEHOLDER_ANOMALIES: Anomaly[] = [
    { detail: 'Last indexed 4 hours ago — search recall may be degraded.', id: '1', severity: 'warn', title: 'Hyphae index stale' },
  ]

  const sparkData = Array.from({ length: 7 }, (_, i) => Math.max(0, (avgSavingsPct ?? 0) * (0.7 + i * 0.05)))

  return (
    <Stack gap='xl'>
      {/* Health Strip */}
      <HealthStrip
        tokensSaved={gain?.summary?.total_saved ?? undefined}
        tools={toolsStatus}
      />

      {/* Anomaly List */}
      <AnomalyList anomalies={PLACEHOLDER_ANOMALIES} />

      {/* Hero Section */}
      <Card
        padding='xl'
        radius='lg'
        withBorder
      >
        <Text
          c='dimmed'
          mb='xs'
          size='sm'
        >
          avg token savings
        </Text>
        <Title
          c='mycelium.6'
          fz={64}
          order={1}
        >
          {avgSavingsPct !== null ? `${avgSavingsPct.toFixed(1)}%` : '—'}
        </Title>
        <Text
          c='dimmed'
          size='sm'
        >
          across {stats.total_memories} memories in {stats.total_topics} topics
        </Text>
      </Card>

      {/* Stats Grid */}
      <SimpleGrid
        cols={{ base: 1, sm: 3 }}
        spacing='lg'
      >
        <KpiCard
          accent='mycelium.7'
          label='Memories'
          sparkData={sparkData}
          value={String(stats.total_memories)}
        />
        <KpiCard
          accent='spore.6'
          label='Topics'
          value={String(stats.total_topics)}
        />
        <KpiCard
          accent='substrate.6'
          label='Avg Weight'
          value={stats.avg_weight?.toFixed(3) ?? '—'}
        />
      </SimpleGrid>

      {/* Topics Section with Timeline */}
      <SectionCard title='Active Topics'>
        {topics.length > 0 ? (
          <Timeline
            active={-1}
            bulletSize={24}
            lineWidth={2}
          >
            {topics.slice(0, 6).map((topic) => (
              <Timeline.Item
                bullet={
                  <div
                    style={{
                      backgroundColor: topic.avg_weight > 0.7 ? '#e3f2ff' : topic.avg_weight > 0.4 ? '#fff3e0' : '#ffebee',
                      borderRadius: '50%',
                      height: '12px',
                      width: '12px',
                    }}
                  />
                }
                key={topic.topic}
                title={topic.topic}
              >
                <Text
                  c='dimmed'
                  mt={4}
                  size='sm'
                >
                  {topic.count} memories
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Text
            c='dimmed'
            size='sm'
          >
            No topics yet
          </Text>
        )}
      </SectionCard>

      {/* Health Section */}
      <SectionCard title='Memory Health'>
        {health.length > 0 ? (
          <Stack gap='md'>
            {health.map((item) => (
              <div key={item.topic}>
                <Group
                  justify='space-between'
                  mb={8}
                >
                  <Text
                    fw={500}
                    size='sm'
                  >
                    {item.topic}
                  </Text>
                  <Group gap='xs'>
                    {item.critical_count > 0 && (
                      <Badge
                        color='gill'
                        size='xs'
                        variant='light'
                      >
                        {item.critical_count} critical
                      </Badge>
                    )}
                    {item.high_count > 0 && (
                      <Badge
                        color='fruiting'
                        size='xs'
                        variant='light'
                      >
                        {item.high_count} high
                      </Badge>
                    )}
                    {item.low_weight_count > 0 && (
                      <Badge
                        color='substrate'
                        size='xs'
                        variant='light'
                      >
                        {item.low_weight_count} fading
                      </Badge>
                    )}
                  </Group>
                </Group>
                <Progress
                  color={item.avg_weight > 0.7 ? 'mycelium' : item.avg_weight > 0.4 ? 'substrate' : 'decay'}
                  size='lg'
                  value={item.avg_weight * 100}
                />
              </div>
            ))}
          </Stack>
        ) : (
          <Text
            c='dimmed'
            size='sm'
          >
            No health data
          </Text>
        )}
      </SectionCard>

      {/* Ecosystem Status */}
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

      {/* Recent Sessions */}
      <SectionCard title='Recent Sessions'>
        {sessions.length > 0 ? (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Session</Table.Th>
                <Table.Th style={{ width: '100px' }}>Tokens</Table.Th>
                <Table.Th style={{ width: '80px' }}>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.slice(0, 5).map((session) => (
                <Table.Tr key={session.id}>
                  <Table.Td>
                    <Text size='sm'>{session.id.slice(0, 8)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>—</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={session.status === 'completed' ? 'mycelium' : 'gray'}
                      size='xs'
                      variant='light'
                    >
                      {session.status}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text
            c='dimmed'
            size='sm'
          >
            No sessions yet
          </Text>
        )}
      </SectionCard>
    </Stack>
  )
}
