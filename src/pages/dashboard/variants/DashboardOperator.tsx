import { Badge, Grid, Group, Progress, SimpleGrid, Stack, Table, Text } from '@mantine/core'

import type { EcosystemStatus, GainResult, HealthResult, Stats, TopicSummary } from '../../../lib/api'
import { KpiCard } from '../../../components/KpiCard'
import { SectionCard } from '../../../components/SectionCard'

export interface DashboardVariantProps {
  stats: Stats
  topics: TopicSummary[]
  health: HealthResult[]
  gain: GainResult | undefined
  ecosystemStatus: EcosystemStatus | undefined
}

export function DashboardOperator({
  gain,
  stats,
  topics,
  health,
  ecosystemStatus,
}: DashboardVariantProps) {
  const avgSavingsPct = gain?.avg_savings_pct ?? gain?.summary?.avg_savings_pct ?? null

  return (
    <Stack gap='sm'>
      {/* Row 1: KPI Tiles */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing='xs'>
        <KpiCard accent='mycelium.7' label='Memories' value={String(stats.total_memories)} />
        <KpiCard accent='spore.6' label='Topics' value={String(stats.total_topics)} />
        <KpiCard accent='substrate.6' label='Avg Weight' value={stats.avg_weight?.toFixed(3) ?? '—'} />
        <KpiCard accent='fruiting.6' label='Token Savings' value={avgSavingsPct !== null ? `${avgSavingsPct.toFixed(1)}%` : '—'} />
      </SimpleGrid>

      {/* Row 2: Topics and Health */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <SectionCard title='Topics'>
            {topics.length > 0 ? (
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Topic</Table.Th>
                    <Table.Th style={{ width: '80px' }}>Memories</Table.Th>
                    <Table.Th style={{ width: '100px' }}>Avg Weight</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {topics.slice(0, 8).map((topic) => (
                    <Table.Tr key={topic.topic}>
                      <Table.Td>
                        <Text size='sm'>{topic.topic}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size='sm'>{topic.count}</Text>
                      </Table.Td>
                      <Table.Td>
                        <div style={{ marginBottom: '4px' }}>
                          <Text size='xs'>{topic.avg_weight.toFixed(3)}</Text>
                        </div>
                        <Progress
                          color={topic.avg_weight > 0.7 ? 'mycelium' : topic.avg_weight > 0.4 ? 'substrate' : 'decay'}
                          size='xs'
                          value={topic.avg_weight * 100}
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c='dimmed' size='sm'>
                No topics yet
              </Text>
            )}
          </SectionCard>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <SectionCard title='Memory Health'>
            {health.length > 0 ? (
              <Stack gap='sm'>
                {health.map((item) => (
                  <div key={item.topic}>
                    <Group justify='space-between' mb={4}>
                      <Text size='sm'>{item.topic}</Text>
                      <Group gap='xs'>
                        {item.critical_count > 0 && (
                          <Badge color='gill' size='xs' variant='light'>
                            {item.critical_count} critical
                          </Badge>
                        )}
                        {item.high_count > 0 && (
                          <Badge color='fruiting' size='xs' variant='light'>
                            {item.high_count} high
                          </Badge>
                        )}
                        {item.low_weight_count > 0 && (
                          <Badge color='substrate' size='xs' variant='light'>
                            {item.low_weight_count} fading
                          </Badge>
                        )}
                      </Group>
                    </Group>
                    <Progress
                      color={item.avg_weight > 0.7 ? 'mycelium' : item.avg_weight > 0.4 ? 'substrate' : 'decay'}
                      value={item.avg_weight * 100}
                    />
                  </div>
                ))}
              </Stack>
            ) : (
              <Text c='dimmed' size='sm'>
                No health data
              </Text>
            )}
          </SectionCard>
        </Grid.Col>
      </Grid>

      {/* Row 3: Ecosystem Status */}
      {ecosystemStatus && (
        <Group gap='xs'>
          <Badge color={ecosystemStatus.mycelium.available ? 'mycelium' : 'red'} variant='light'>
            Mycelium {ecosystemStatus.mycelium.available ? '✓' : '✗'}
          </Badge>
          <Badge color={ecosystemStatus.hyphae.available ? 'substrate' : 'red'} variant='light'>
            Hyphae {ecosystemStatus.hyphae.available ? '✓' : '✗'}
          </Badge>
          <Badge color={ecosystemStatus.rhizome.available ? 'fruiting' : 'red'} variant='light'>
            Rhizome {ecosystemStatus.rhizome.available ? '✓' : '✗'}
          </Badge>
        </Group>
      )}
    </Stack>
  )
}
