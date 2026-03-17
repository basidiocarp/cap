import { BarChart, LineChart, PieChart } from '@mantine/charts'
import { Alert, Badge, Box, Grid, Group, RingProgress, Stack, Table, Tabs, Text, Title } from '@mantine/core'
import { IconBrain, IconChartBar, IconCode, IconNetwork } from '@tabler/icons-react'

import type { EcosystemStatus, HyphaeAnalytics, MyceliumAnalytics, RhizomeAnalytics } from '../lib/api'
import { KpiCard } from '../components/KpiCard'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { weightColor } from '../lib/colors'
import { useEcosystemStatus, useHyphaeAnalytics, useMyceliumAnalytics, useRhizomeAnalytics } from '../lib/queries'

const PIE_COLORS = ['spore.6', 'fruiting.6', 'mycelium.6', 'chitin.5', 'lichen.6', 'gill.6']

function ChartBox({ children }: { children: React.ReactNode }) {
  return <Box py='xs'>{children}</Box>
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
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='spore.6'
            label='Supported Tools'
            value={data.supported_tools.length.toLocaleString()}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='lichen.6'
            label='Languages'
            value={data.languages.length.toLocaleString()}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='chitin.5'
            label='Backend Status'
            value={data.backend_usage.lsp ? 'LSP' : data.backend_usage.treesitter ? 'Tree-sitter' : 'None'}
          >
            <Group
              gap='xs'
              mt='xs'
            >
              <Badge
                color={data.backend_usage.treesitter ? 'mycelium' : 'decay'}
                size='xs'
                variant='filled'
              >
                Tree-sitter
              </Badge>
              <Badge
                color={data.backend_usage.lsp ? 'mycelium' : 'decay'}
                size='xs'
                variant='filled'
              >
                LSP
              </Badge>
            </Group>
          </KpiCard>
        </Grid.Col>
      </Grid>

      {data.supported_tools.length > 0 && (
        <SectionCard title='Supported Tools'>
          <Group gap='xs'>
            {data.supported_tools.map((tool) => (
              <Badge
                color='spore'
                key={tool}
                variant='light'
              >
                {tool}
              </Badge>
            ))}
          </Group>
        </SectionCard>
      )}

      {data.tool_calls.length > 0 && (
        <SectionCard title='Tool Call Distribution'>
          <Group justify='center'>
            <PieChart
              data={pieData}
              mx='auto'
              size={250}
              withLabels
              withTooltip
            />
          </Group>
        </SectionCard>
      )}

      {data.languages.length > 0 && (
        <SectionCard title='Languages'>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Language</Table.Th>
                <Table.Th>Detection</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.languages.map((lang) => (
                <Table.Tr key={lang.language}>
                  <Table.Td>{lang.language}</Table.Td>
                  <Table.Td>{lang.detection}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}
    </Stack>
  )
}

function EcosystemTab({ data }: { data: EcosystemStatus | null }) {
  if (!data) {
    return (
      <Alert
        color='yellow'
        title='Unavailable'
      >
        Ecosystem status data is not available.
      </Alert>
    )
  }

  return (
    <Stack>
      <SectionCard title='Service Status'>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap='xs'>
              <Badge
                color={data.mycelium.available ? 'mycelium' : 'decay'}
                size='lg'
                variant='filled'
              >
                Mycelium: {data.mycelium.available ? 'Connected' : 'Not Connected'}
              </Badge>
              {data.mycelium.version && (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  v{data.mycelium.version}
                </Text>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap='xs'>
              <Badge
                color={data.hyphae.available ? 'mycelium' : 'decay'}
                size='lg'
                variant='filled'
              >
                Hyphae: {data.hyphae.available ? 'Connected' : 'Not Connected'}
              </Badge>
              {data.hyphae.available && (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  {data.hyphae.memories} memories, {data.hyphae.memoirs} memoirs
                  {data.hyphae.version ? ` · v${data.hyphae.version}` : ''}
                </Text>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap='xs'>
              <Badge
                color={data.rhizome.available ? 'mycelium' : 'decay'}
                size='lg'
                variant='filled'
              >
                Rhizome: {data.rhizome.available ? 'Connected' : 'Not Connected'}
              </Badge>
              {data.rhizome.available && (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  {data.rhizome.languages.length} languages
                </Text>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </SectionCard>

      <SectionCard title='Integration Connections'>
        <Stack gap='sm'>
          <Group>
            <Badge
              color={data.mycelium.available && data.hyphae.available ? 'mycelium' : 'decay'}
              variant='light'
            >
              Mycelium → Hyphae
            </Badge>
            <Text
              c='dimmed'
              size='sm'
            >
              {data.mycelium.available && data.hyphae.available ? 'Context chunking active' : 'Not connected'}
            </Text>
          </Group>
          <Group>
            <Badge
              color={data.rhizome.available && data.hyphae.available ? 'mycelium' : 'decay'}
              variant='light'
            >
              Rhizome → Hyphae
            </Badge>
            <Text
              c='dimmed'
              size='sm'
            >
              {data.rhizome.available && data.hyphae.available ? 'Code memoir export active' : 'Not connected'}
            </Text>
          </Group>
        </Stack>
      </SectionCard>
    </Stack>
  )
}

export function Analytics() {
  const { data: ecosystemData = null, isLoading: ecosystemLoading } = useEcosystemStatus()
  const { data: hyphaeData = null, isLoading: hyphaeLoading } = useHyphaeAnalytics()
  const { data: myceliumData = null, isLoading: myceliumLoading } = useMyceliumAnalytics()
  const { data: rhizomeData = null, isLoading: rhizomeLoading } = useRhizomeAnalytics()

  const loading = ecosystemLoading || hyphaeLoading || myceliumLoading || rhizomeLoading

  const totalTokensSaved = myceliumData ? myceliumData.total_stats.total_tokens_saved : null

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
          <EcosystemTab data={ecosystemData} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
