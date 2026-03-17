import { BarChart } from '@mantine/charts'
import { Alert, Grid, Group, RingProgress, Stack, Table, Text, Title } from '@mantine/core'

import type { HyphaeAnalytics } from '../../lib/api'
import { KpiCard } from '../../components/KpiCard'
import { SectionCard } from '../../components/SectionCard'
import { weightColor } from '../../lib/colors'
import { ChartBox } from './ChartBox'

export function MemoryHealthTab({ data }: { data: HyphaeAnalytics | null }) {
  if (!data) {
    return (
      <Alert
        color='yellow'
        title='Unavailable'
      >
        Hyphae analytics data is not available.
      </Alert>
    )
  }

  const utilizationPct = Math.round(data.memory_utilization.rate * 100)

  const importanceData = [
    {
      critical: data.importance_distribution.critical,
      ephemeral: data.importance_distribution.ephemeral,
      high: data.importance_distribution.high,
      label: 'Importance',
      low: data.importance_distribution.low,
      medium: data.importance_distribution.medium,
    },
  ]

  return (
    <Stack>
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <SectionCard
            h='100%'
            title='Memory Utilization'
          >
            <Group justify='center'>
              <RingProgress
                label={
                  <Text
                    fw={700}
                    size='lg'
                    ta='center'
                  >
                    {utilizationPct}%
                  </Text>
                }
                sections={[{ color: 'mycelium.7', value: utilizationPct }]}
                size={140}
              />
            </Group>
            <Text
              c='dimmed'
              mt='sm'
              size='sm'
              ta='center'
            >
              {data.memory_utilization.recalled} recalled / {data.memory_utilization.total} total
            </Text>
          </SectionCard>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack
            gap='md'
            h='100%'
          >
            <Grid>
              <Grid.Col span={{ base: 6, md: 3 }}>
                <KpiCard
                  accent='mycelium.7'
                  label='Created (7d)'
                  value={data.lifecycle.created_last_7d.toLocaleString()}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 3 }}>
                <KpiCard
                  accent='mycelium.6'
                  label='Created (30d)'
                  value={data.lifecycle.created_last_30d.toLocaleString()}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 3 }}>
                <KpiCard
                  accent='chitin.5'
                  label='Decayed'
                  value={data.lifecycle.decayed.toLocaleString()}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 3 }}>
                <KpiCard
                  accent='chitin.5'
                  label='Pruned'
                  value={data.lifecycle.pruned.toLocaleString()}
                />
              </Grid.Col>
            </Grid>

            <SectionCard
              style={{ flex: 1 }}
              title='Avg Weight'
            >
              <Group>
                <Title
                  c={weightColor(data.lifecycle.avg_weight)}
                  order={3}
                >
                  {data.lifecycle.avg_weight.toFixed(2)}
                </Title>
                <Text
                  c='dimmed'
                  size='sm'
                >
                  (min: {data.lifecycle.min_weight.toFixed(2)})
                </Text>
              </Group>
            </SectionCard>
          </Stack>
        </Grid.Col>
      </Grid>

      <SectionCard title='Importance Distribution'>
        <ChartBox>
          <BarChart
            data={importanceData}
            dataKey='label'
            h={120}
            orientation='vertical'
            series={[
              { color: 'gill.6', name: 'critical' },
              { color: 'mycelium.6', name: 'high' },
              { color: 'substrate.6', name: 'medium' },
              { color: 'decay.5', name: 'low' },
              { color: 'chitin.5', name: 'ephemeral' },
            ]}
            type='stacked'
            withLegend
          />
        </ChartBox>
      </SectionCard>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='spore.6'
            label='Code Memoirs'
            value={data.memoir_stats.code_memoirs.toLocaleString()}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='lichen.6'
            label='Total Concepts'
            value={data.memoir_stats.total_concepts.toLocaleString()}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='lichen.6'
            label='Total Links'
            value={data.memoir_stats.total_links.toLocaleString()}
          />
        </Grid.Col>
      </Grid>

      {data.top_topics.length > 0 && (
        <SectionCard title='Top Topics'>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Topic</Table.Th>
                <Table.Th>Count</Table.Th>
                <Table.Th>Avg Weight</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.top_topics.map((topic) => (
                <Table.Tr key={topic.name}>
                  <Table.Td>{topic.name}</Table.Td>
                  <Table.Td>{topic.count.toLocaleString()}</Table.Td>
                  <Table.Td>{topic.avg_weight.toFixed(2)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}
    </Stack>
  )
}
