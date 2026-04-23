import { Alert, Badge, Button, Grid, Stack, Table, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { EvaluationPeriodMetric, EvaluationResult } from '../../lib/api'
import { ActionEmptyState } from '../../components/ActionEmptyState'
import { KpiCard } from '../../components/KpiCard'
import { SectionCard } from '../../components/SectionCard'

function getTrendColor(trend: string): string {
  switch (trend) {
    case 'improving':
      return 'green'
    case 'declining':
      return 'red'
    case 'stable':
      return 'gray'
    default:
      return 'gray'
  }
}

function getTrendLabel(trend: string): string {
  switch (trend) {
    case 'improving':
      return 'Improving'
    case 'declining':
      return 'Declining'
    case 'stable':
      return 'Stable'
    default:
      return 'Unknown'
  }
}

export function EvaluationTab({ data }: { data: EvaluationResult | null }) {
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
        description='Cap could not load Hyphae evaluation data yet.'
        hint='This tab shows agent performance metrics over the selected period, comparing the first and second half of the window.'
        title='Evaluation data is unavailable'
      />
    )
  }

  const verdictColor = data.overall_verdict.toLowerCase().includes('needs attention')
    ? 'yellow'
    : data.overall_verdict.toLowerCase().includes('excellent')
      ? 'green'
      : 'blue'

  return (
    <Stack>
      <Alert
        color='spore'
        title='What this tab measures'
      >
        Agent Evaluation compares agent performance across two equal time periods: the first {data.half_days} days versus the most recent{' '}
        {data.half_days} days. Metrics show trends to help identify if agent behavior is improving, declining, or staying stable.
      </Alert>

      <SectionCard title='Period Configuration'>
        <Stack gap='sm'>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <KpiCard
                accent='mycelium.7'
                label='Evaluation Window'
                value={`${data.days} days`}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <KpiCard
                accent='mycelium.6'
                label='Previous Period'
                value={`${data.half_days} days`}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <KpiCard
                accent='mycelium.6'
                label='Recent Period'
                value={`${data.half_days} days`}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </SectionCard>

      <SectionCard title='Overall Assessment'>
        <Alert
          color={verdictColor}
          title={data.overall_verdict}
        >
          This represents the consolidated evaluation outcome across all tracked metrics. Review the detailed metrics table below for
          specific areas of change.
        </Alert>
      </SectionCard>

      {data.metrics.length > 0 && (
        <SectionCard title='Metrics Comparison'>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Metric</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Previous {data.half_days}d</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Recent {data.half_days}d</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Trend</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.metrics.map((metric: EvaluationPeriodMetric) => (
                <Table.Tr key={metric.name}>
                  <Table.Td>{metric.name}</Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Text size='sm'>{metric.previous}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Text size='sm'>{metric.recent}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <Badge
                      color={getTrendColor(metric.trend)}
                      size='sm'
                      variant='light'
                    >
                      {getTrendLabel(metric.trend)}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}

      {(data.recall_non_zero_rate !== null || data.recall_avg_effectiveness !== null) && (
        <SectionCard title='Recall Effectiveness'>
          <Grid>
            {data.recall_non_zero_rate !== null && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <KpiCard
                  accent='fruiting.6'
                  label='Non-zero Score Rate'
                  value={data.recall_non_zero_rate}
                >
                  <Text
                    c='dimmed'
                    mt='xs'
                    size='xs'
                  >
                    Percentage of recalls that returned relevant memories
                  </Text>
                </KpiCard>
              </Grid.Col>
            )}
            {data.recall_avg_effectiveness !== null && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <KpiCard
                  accent='fruiting.6'
                  label='Average Effectiveness'
                  value={data.recall_avg_effectiveness}
                >
                  <Text
                    c='dimmed'
                    mt='xs'
                    size='xs'
                  >
                    Average quality score of recalled memories
                  </Text>
                </KpiCard>
              </Grid.Col>
            )}
          </Grid>
        </SectionCard>
      )}
    </Stack>
  )
}
