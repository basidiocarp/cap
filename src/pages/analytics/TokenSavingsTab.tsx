import { BarChart, LineChart } from '@mantine/charts'
import { Alert, Grid, Stack, Table, Text } from '@mantine/core'

import type { MyceliumAnalytics } from '../../lib/api'
import { KpiCard } from '../../components/KpiCard'
import { SectionCard } from '../../components/SectionCard'
import { ChartBox } from './ChartBox'

export function TokenSavingsTab({ data }: { data: MyceliumAnalytics | null }) {
  if (!data) {
    return (
      <Alert
        color='yellow'
        title='Unavailable'
      >
        Mycelium analytics data is not available.
      </Alert>
    )
  }

  return (
    <Stack>
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='chitin.5'
            label='Total Commands'
            value={data.total_stats.total_commands.toLocaleString()}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='mycelium.7'
            label='Total Tokens Saved'
            value={data.total_stats.total_tokens_saved.toLocaleString()}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='spore.6'
            label='Overall Savings Rate'
            value={`${(data.total_stats.overall_rate * 100).toFixed(1)}%`}
          >
            <Text
              c='dimmed'
              mt='xs'
              size='xs'
            >
              {data.filter_hit_rate.filtered.toLocaleString()} filtered ({(data.filter_hit_rate.rate * 100).toFixed(1)}% hit rate)
            </Text>
          </KpiCard>
        </Grid.Col>
      </Grid>

      {data.savings_trend.length > 0 && (
        <SectionCard title='Savings Trend'>
          <ChartBox>
            <LineChart
              curveType='monotone'
              data={data.savings_trend}
              dataKey='date'
              h={300}
              series={[{ color: 'mycelium.6', name: 'tokens_saved' }]}
              strokeWidth={2}
            />
          </ChartBox>
        </SectionCard>
      )}

      {data.savings_by_category.length > 0 && (
        <SectionCard title='Savings by Category'>
          <ChartBox>
            <BarChart
              data={data.savings_by_category}
              dataKey='category'
              h={300}
              series={[
                { color: 'chitin.5', name: 'tokens_input' },
                { color: 'mycelium.6', name: 'tokens_saved' },
              ]}
              type='stacked'
            />
          </ChartBox>
        </SectionCard>
      )}

      {data.top_commands.length > 0 && (
        <SectionCard title='Top Commands'>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Command</Table.Th>
                <Table.Th>Count</Table.Th>
                <Table.Th>Avg Savings %</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.top_commands.map((cmd) => (
                <Table.Tr key={cmd.command}>
                  <Table.Td>{cmd.command}</Table.Td>
                  <Table.Td>{cmd.count.toLocaleString()}</Table.Td>
                  <Table.Td>{cmd.avg_savings_percent.toFixed(1)}%</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}
    </Stack>
  )
}
