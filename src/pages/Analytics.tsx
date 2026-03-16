import { BarChart, LineChart, PieChart } from '@mantine/charts'
import { Alert, Card, Grid, Group, RingProgress, Stack, Table, Tabs, Text, Title } from '@mantine/core'
import { IconBrain, IconChartBar, IconCode, IconNetwork } from '@tabler/icons-react'

import type { HyphaeAnalytics, MyceliumAnalytics, RhizomeAnalytics } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { useHyphaeAnalytics, useMyceliumAnalytics, useRhizomeAnalytics } from '../lib/queries'

const PIE_COLORS = ['spore.6', 'fruiting.6', 'mycelium.6', 'chitin.5', 'lichen.6', 'gill.6']

function KpiCard({ accent, label, value }: { accent: string; label: string; value: string }) {
  return (
    <Card
      padding='lg'
      shadow='sm'
      withBorder
    >
      <Text
        c='dimmed'
        size='xs'
      >
        {label}
      </Text>
      <Title
        c={accent}
        order={3}
      >
        {value}
      </Title>
    </Card>
  )
}

function TokenSavingsTab({ data }: { data: MyceliumAnalytics | null }) {
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
      <Text
        c='dimmed'
        size='sm'
      >
        {data.filter_hit_rate.filtered.toLocaleString()} commands filtered ({(data.filter_hit_rate.rate * 100).toFixed(1)}% hit rate)
      </Text>

      {data.savings_trend.length > 0 && (
        <SectionCard title='Savings Trend'>
          <LineChart
            curveType='monotone'
            data={data.savings_trend}
            dataKey='date'
            h={300}
            series={[{ color: 'fruiting.6', name: 'tokens_saved' }]}
            strokeWidth={2}
          />
        </SectionCard>
      )}

      {data.savings_by_category.length > 0 && (
        <SectionCard title='Savings by Category'>
          <BarChart
            data={data.savings_by_category}
            dataKey='category'
            h={300}
            series={[{ color: 'fruiting.6', name: 'tokens_saved' }]}
          />
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
                  <Table.Td>{(cmd.avg_savings * 100).toFixed(1)}%</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}
    </Stack>
  )
}

function MemoryHealthTab({ data }: { data: HyphaeAnalytics | null }) {
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

  return (
    <Stack>
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <SectionCard title='Memory Utilization'>
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
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <KpiCard
                accent='mycelium.7'
                label='Created (7d)'
                value={data.lifecycle.created_last_7d.toLocaleString()}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <KpiCard
                accent='chitin.5'
                label='Decayed'
                value={data.lifecycle.decayed.toLocaleString()}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <KpiCard
                accent='chitin.5'
                label='Pruned'
                value={data.lifecycle.pruned.toLocaleString()}
              />
            </Grid.Col>
          </Grid>

          <Text
            c='dimmed'
            mt='md'
            size='sm'
          >
            {data.memoir_stats.total} memoirs, {data.memoir_stats.total_concepts.toLocaleString()} concepts
          </Text>
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

function CodeIntelligenceTab({ data }: { data: RhizomeAnalytics | null }) {
  if (!data) {
    return (
      <Alert
        color='yellow'
        title='Unavailable'
      >
        Rhizome analytics data is not available.
      </Alert>
    )
  }

  if (!data.available) {
    return (
      <Alert
        color='substrate'
        title='Rhizome Not Installed'
      >
        Rhizome is not installed or not available. Install it to see code intelligence analytics.
      </Alert>
    )
  }

  const pieData = data.tool_calls.map((tc, idx) => ({
    color: PIE_COLORS[idx % PIE_COLORS.length],
    name: tc.tool,
    value: tc.count,
  }))

  return (
    <Stack>
      <Text
        c='dimmed'
        size='sm'
      >
        Tree-sitter: {data.backend_usage.treesitter.toLocaleString()} calls, LSP: {data.backend_usage.lsp.toLocaleString()} calls
      </Text>

      {data.tool_calls.length > 0 && (
        <SectionCard title='Tool Call Distribution'>
          <PieChart
            data={pieData}
            size={250}
            withLabels
            withTooltip
          />
        </SectionCard>
      )}

      {data.languages.length > 0 && (
        <SectionCard title='Languages'>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Language</Table.Th>
                <Table.Th>Files Parsed</Table.Th>
                <Table.Th>Symbols Extracted</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.languages.map((lang) => (
                <Table.Tr key={lang.language}>
                  <Table.Td>{lang.language}</Table.Td>
                  <Table.Td>{lang.files_parsed.toLocaleString()}</Table.Td>
                  <Table.Td>{lang.symbols_extracted.toLocaleString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}
    </Stack>
  )
}

export function Analytics() {
  const { data: hyphaeData = null, isLoading: hyphaeLoading } = useHyphaeAnalytics()
  const { data: myceliumData = null, isLoading: myceliumLoading } = useMyceliumAnalytics()
  const { data: rhizomeData = null, isLoading: rhizomeLoading } = useRhizomeAnalytics()

  const loading = hyphaeLoading || myceliumLoading || rhizomeLoading

  const totalTokensSaved = myceliumData ? myceliumData.savings_by_category.reduce((sum, c) => sum + c.tokens_saved, 0) : null

  const memoryUtilization = hyphaeData ? Math.round(hyphaeData.memory_utilization.rate * 100) : null

  const languagesIndexed = rhizomeData?.available ? rhizomeData.languages.length : null

  return (
    <Stack>
      <Title order={2}>Analytics</Title>

      {loading && <PageLoader mt='xl' />}

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='fruiting.6'
            label='Total Tokens Saved'
            value={totalTokensSaved != null ? totalTokensSaved.toLocaleString() : '\u2014'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='mycelium.7'
            label='Memory Utilization'
            value={memoryUtilization != null ? `${memoryUtilization}%` : '\u2014'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='spore.6'
            label='Languages Indexed'
            value={languagesIndexed != null ? languagesIndexed.toLocaleString() : '\u2014'}
          />
        </Grid.Col>
      </Grid>

      <Tabs defaultValue='token-savings'>
        <Tabs.List>
          <Tabs.Tab
            leftSection={<IconChartBar size={16} />}
            value='token-savings'
          >
            Token Savings
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconBrain size={16} />}
            value='memory-health'
          >
            Memory Health
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconCode size={16} />}
            value='code-intelligence'
          >
            Code Intelligence
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconNetwork size={16} />}
            value='ecosystem'
          >
            Ecosystem
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          pt='md'
          value='token-savings'
        >
          <TokenSavingsTab data={myceliumData} />
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='memory-health'
        >
          <MemoryHealthTab data={hyphaeData} />
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='code-intelligence'
        >
          <CodeIntelligenceTab data={rhizomeData} />
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='ecosystem'
        >
          <Alert
            color='lichen'
            title='Coming Soon'
            variant='light'
          >
            Cross-tool correlation analytics coming soon. This will show how using multiple ecosystem tools together impacts efficiency.
          </Alert>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
