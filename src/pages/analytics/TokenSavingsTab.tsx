import { BarChart, LineChart } from '@mantine/charts'
import { Alert, Button, Grid, Stack, Table, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import type { MyceliumAnalytics } from '../../lib/api'
import { myceliumApi } from '../../lib/api/mycelium'
import { ActionEmptyState } from '../../components/ActionEmptyState'
import { KpiCard } from '../../components/KpiCard'
import { SectionCard } from '../../components/SectionCard'
import { ChartBox } from './ChartBox'

function shortenProjectPath(path: string, maxComponents: number = 2): string {
  const parts = path.split('/')
  if (parts.length <= maxComponents) return path
  const last = parts.slice(-maxComponents).join('/')
  return `.../${last}`
}

export function TokenSavingsTab({ data }: { data: MyceliumAnalytics | null }) {
  const { data: projectsGain } = useQuery({
    queryKey: ['mycelium', 'gain', 'projects'],
    queryFn: () => myceliumApi.gainProjects(),
    enabled: !!data,
  })

  if (!data) {
    return (
      <ActionEmptyState
        actions={
          <>
            <Button
              component={Link}
              size='xs'
              to='/status'
              variant='light'
            >
              Check status
            </Button>
            <Button
              component={Link}
              size='xs'
              to='/onboard'
              variant='subtle'
            >
              Open onboarding
            </Button>
          </>
        }
        description='Cap could not load token savings from Mycelium yet.'
        hint='This view only reflects commands that actually flowed through Mycelium. If you use Claude Code or Codex directly, those turns will not appear here.'
        title='Token savings are unavailable'
      />
    )
  }

  if (data.total_stats.total_commands === 0) {
    return (
      <ActionEmptyState
        actions={
          <>
            <Button
              component={Link}
              size='xs'
              to='/status'
              variant='light'
            >
              Verify Mycelium
            </Button>
            <Button
              component={Link}
              size='xs'
              to='/onboard'
              variant='subtle'
            >
              Repair setup
            </Button>
          </>
        }
        description='Mycelium has not recorded any filtered commands yet, so there is no savings history to chart.'
        hint='Run commands through Mycelium to populate this page. Direct shell commands and host turns that bypass Mycelium will not count here.'
        title='No token savings yet'
      />
    )
  }

  return (
    <Stack>
      <Alert
        color='mycelium'
        title='How to read token savings'
      >
        Token savings only reflect commands captured by Mycelium. Use Command History to inspect the underlying entries when this page looks
        lower than your overall Claude Code or Codex activity.
      </Alert>

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

      {projectsGain && projectsGain.length > 0 && (
        <SectionCard title='By Project'>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Project</Table.Th>
                <Table.Th>Commands</Table.Th>
                <Table.Th>Tokens Saved</Table.Th>
                <Table.Th>Avg Savings %</Table.Th>
                <Table.Th>Last Used</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {projectsGain.map((project) => (
                <Table.Tr key={project.project_path}>
                  <Table.Td title={project.project_path}>
                    <Text size='sm'>{shortenProjectPath(project.project_path)}</Text>
                  </Table.Td>
                  <Table.Td>{project.commands.toLocaleString()}</Table.Td>
                  <Table.Td>{project.saved_tokens.toLocaleString()}</Table.Td>
                  <Table.Td>{project.avg_savings_pct.toFixed(1)}%</Table.Td>
                  <Table.Td>
                    <Text size='sm'>{project.last_used.slice(0, 10)}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}
    </Stack>
  )
}
