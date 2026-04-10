import { Badge, Grid, Group, Stack, Table, Text, Title } from '@mantine/core'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { SessionUsage, UsageAggregate, UsageTrend } from '../../lib/api'
import { KpiCard } from '../../components/KpiCard'
import { ChartBox } from './ChartBox'

interface Props {
  aggregate: UsageAggregate | null
  sessions: SessionUsage[] | null
  trend: UsageTrend[] | null
}

export const USAGE_COST_CHART_DIMENSIONS = {
  height: 250,
  initialDimension: { height: 0, width: 0 },
  minHeight: 250,
  minWidth: 100,
  width: '100%',
} as const

function formatCost(cost: number): string {
  if (cost < 0.01) return '<$0.01'
  return `$${cost.toFixed(2)}`
}

function runtimeLabel(runtime: SessionUsage['runtime']): string {
  return runtime === 'codex' ? 'Codex' : 'Claude Code'
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return String(tokens)
}

function summarizeUsageHistory(sessions: SessionUsage[] | null) {
  if (!sessions || sessions.length === 0) return null

  const counts = sessions.reduce(
    (acc, session) => {
      acc[session.runtime] += 1
      return acc
    },
    { 'claude-code': 0, codex: 0 }
  )

  const runtimeSummary: string[] = []

  if (counts.codex > 0) runtimeSummary.push(`${counts.codex} Codex`)
  if (counts['claude-code'] > 0) runtimeSummary.push(`${counts['claude-code']} Claude Code`)

  return {
    runtimeSummary: runtimeSummary.length > 0 ? runtimeSummary.join(' · ') : 'No runtime history was captured yet.',
    title: 'Usage history only',
    usageNote: 'This tab shows parsed session history only. It does not verify host configuration or installed adapters.',
  }
}

export function UsageCostTab({ aggregate, sessions, trend }: Props) {
  if (!aggregate) {
    return (
      <Text
        c='dimmed'
        size='sm'
      >
        No usage data available. Session transcripts will be parsed when available.
      </Text>
    )
  }

  const usageHistory = summarizeUsageHistory(sessions)

  return (
    <Stack gap='lg'>
      <Stack gap={2}>
        <Group justify='space-between'>
          <Text
            c='dimmed'
            size='sm'
          >
            {usageHistory?.usageNote ??
              'This tab shows parsed session history only. It does not verify host configuration or installed adapters.'}
          </Text>
          <Badge
            color='gray'
            size='sm'
            variant='light'
          >
            {usageHistory?.title ?? 'Usage history'}
          </Badge>
        </Group>
        {usageHistory && (
          <Text
            c='dimmed'
            size='xs'
          >
            Seen in history: {usageHistory.runtimeSummary}
          </Text>
        )}
      </Stack>

      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <KpiCard
            accent='fruiting.6'
            label='Total Cost'
            value={formatCost(aggregate.total_cost)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <KpiCard
            accent='mycelium.6'
            label='Total Tokens'
            value={formatTokens(aggregate.total_input_tokens + aggregate.total_output_tokens)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <KpiCard
            accent='spore.6'
            label='Avg Cost/Session'
            value={formatCost(aggregate.avg_cost_per_session)}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <KpiCard
            accent='lichen.6'
            label='Cache Hit Rate'
            value={`${Math.round(aggregate.cache_hit_rate * 100)}%`}
          />
        </Grid.Col>
      </Grid>

      {trend && trend.length > 0 && (
        <>
          <Title order={4}>Daily Cost Trend</Title>
          <ChartBox mih={250}>
            <ResponsiveContainer
              height={USAGE_COST_CHART_DIMENSIONS.height}
              initialDimension={USAGE_COST_CHART_DIMENSIONS.initialDimension}
              minHeight={USAGE_COST_CHART_DIMENSIONS.minHeight}
              minWidth={USAGE_COST_CHART_DIMENSIONS.minWidth}
              width={USAGE_COST_CHART_DIMENSIONS.width}
            >
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='date'
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => formatCost(v)}
                />
                <Tooltip formatter={(v) => formatCost(Number(v))} />
                <Line
                  dataKey='cost'
                  name='Cost'
                  stroke='var(--mantine-color-fruiting-6)'
                  strokeWidth={2}
                  type='monotone'
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>

          <Title order={4}>Token Usage by Day</Title>
          <ChartBox mih={250}>
            <ResponsiveContainer
              height={USAGE_COST_CHART_DIMENSIONS.height}
              initialDimension={USAGE_COST_CHART_DIMENSIONS.initialDimension}
              minHeight={USAGE_COST_CHART_DIMENSIONS.minHeight}
              minWidth={USAGE_COST_CHART_DIMENSIONS.minWidth}
              width={USAGE_COST_CHART_DIMENSIONS.width}
            >
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='date'
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => formatTokens(v)}
                />
                <Tooltip formatter={(v) => formatTokens(Number(v))} />
                <Bar
                  dataKey='input_tokens'
                  fill='var(--mantine-color-mycelium-6)'
                  name='Input'
                  stackId='tokens'
                />
                <Bar
                  dataKey='output_tokens'
                  fill='var(--mantine-color-spore-6)'
                  name='Output'
                  stackId='tokens'
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </>
      )}

      {sessions && sessions.length > 0 && (
        <>
          <Title order={4}>Recent Sessions</Title>
          <Table
            highlightOnHover
            striped
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Project</Table.Th>
                <Table.Th>Runtime</Table.Th>
                <Table.Th>Model</Table.Th>
                <Table.Th>Tokens</Table.Th>
                <Table.Th>Cost</Table.Th>
                <Table.Th>Messages</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sessions.slice(0, 20).map((s) => (
                <Table.Tr key={s.session_id}>
                  <Table.Td>{s.timestamp.slice(0, 10)}</Table.Td>
                  <Table.Td>
                    <Badge
                      color='chitin'
                      size='sm'
                      variant='outline'
                    >
                      {s.project}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={s.runtime === 'codex' ? 'blue' : 'grape'}
                      size='sm'
                      variant='light'
                    >
                      {runtimeLabel(s.runtime)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size='xs'>{s.model.replace('claude-', '')}</Text>
                  </Table.Td>
                  <Table.Td>{formatTokens(s.input_tokens + s.output_tokens)}</Table.Td>
                  <Table.Td>{s.cost_known ? formatCost(s.estimated_cost) : 'n/a'}</Table.Td>
                  <Table.Td>{s.duration_messages}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {sessions.some((session) => session.runtime === 'codex') && (
            <Text
              c='dimmed'
              size='xs'
            >
              Codex sessions are parsed from the local Codex sessions directory, and costs stay `n/a` when the model pricing is unknown.
            </Text>
          )}
        </>
      )}
    </Stack>
  )
}
