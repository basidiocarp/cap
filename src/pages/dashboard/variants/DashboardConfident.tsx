import { Badge, Card, Group, Progress, SimpleGrid, Stack, Text, Timeline, Title } from '@mantine/core'

import type { DashboardVariantProps } from './DashboardOperator'
import { KpiCard } from '../../../components/KpiCard'
import { SectionCard } from '../../../components/SectionCard'

export function DashboardConfident({
  gain,
  stats,
  topics,
  health,
  ecosystemStatus,
}: DashboardVariantProps) {
  const avgSavingsPct = gain?.avg_savings_pct ?? gain?.summary?.avg_savings_pct ?? null

  return (
    <Stack gap='xl'>
      {/* Hero Section */}
      <Card padding='xl' radius='lg' withBorder>
        <Text c='dimmed' size='sm' mb='xs'>
          avg token savings
        </Text>
        <Title c='mycelium.6' fz={64} order={1}>
          {avgSavingsPct !== null ? `${avgSavingsPct.toFixed(1)}%` : '—'}
        </Title>
        <Text c='dimmed' size='sm'>
          across {stats.total_memories} memories in {stats.total_topics} topics
        </Text>
      </Card>

      {/* Stats Grid */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing='lg'>
        <KpiCard accent='mycelium.7' label='Memories' value={String(stats.total_memories)} />
        <KpiCard accent='spore.6' label='Topics' value={String(stats.total_topics)} />
        <KpiCard accent='substrate.6' label='Avg Weight' value={stats.avg_weight?.toFixed(3) ?? '—'} />
      </SimpleGrid>

      {/* Topics Section with Timeline */}
      <SectionCard title='Active Topics'>
        {topics.length > 0 ? (
          <Timeline active={-1} bulletSize={24} lineWidth={2}>
            {topics.slice(0, 6).map((topic) => (
              <Timeline.Item bullet={<div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: topic.avg_weight > 0.7 ? '#e3f2ff' : topic.avg_weight > 0.4 ? '#fff3e0' : '#ffebee' }} />} key={topic.topic} title={topic.topic}>
                <Text c='dimmed' mt={4} size='sm'>
                  {topic.count} memories
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Text c='dimmed' size='sm'>
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
                <Group justify='space-between' mb={8}>
                  <Text fw={500} size='sm'>
                    {item.topic}
                  </Text>
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
                  size='lg'
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

      {/* Ecosystem Status */}
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
