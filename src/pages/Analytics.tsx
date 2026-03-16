import { Alert, Card, Grid, Group, Loader, RingProgress, Stack, Table, Tabs, Text, Title } from '@mantine/core'
import { IconBrain, IconChartBar, IconCode, IconNetwork } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { HyphaeAnalytics, MyceliumAnalytics, RhizomeAnalytics } from '../lib/api'
import { hyphaeApi, myceliumApi, rhizomeApi } from '../lib/api'

const COLOR_HYPHAE = '#36b37e'
const COLOR_MYCELIUM = '#ff7452'
const COLOR_NEUTRAL = '#627d98'
const COLOR_RHIZOME = '#6554c0'

const PIE_COLORS = [COLOR_RHIZOME, COLOR_MYCELIUM, COLOR_HYPHAE, COLOR_NEUTRAL, '#00b8d9', '#ff5630']

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
        order={3}
        style={{ color: accent }}
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
        <Card
          padding='lg'
          shadow='sm'
          withBorder
        >
          <Title
            mb='md'
            order={4}
          >
            Savings Trend
          </Title>
          <ResponsiveContainer
            height={300}
            width='100%'
          >
            <LineChart data={data.savings_trend}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='date' />
              <YAxis />
              <Tooltip />
              <Line
                dataKey='tokens_saved'
                name='Tokens Saved'
                stroke={COLOR_MYCELIUM}
                strokeWidth={2}
                type='monotone'
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {data.savings_by_category.length > 0 && (
        <Card
          padding='lg'
          shadow='sm'
          withBorder
        >
          <Title
            mb='md'
            order={4}
          >
            Savings by Category
          </Title>
          <ResponsiveContainer
            height={300}
            width='100%'
          >
            <BarChart data={data.savings_by_category}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='category' />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey='tokens_saved'
                fill={COLOR_MYCELIUM}
                name='Tokens Saved'
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {data.top_commands.length > 0 && (
        <Card
          padding='lg'
          shadow='sm'
          withBorder
        >
          <Title
            mb='md'
            order={4}
          >
            Top Commands
          </Title>
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
        </Card>
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
          <Card
            padding='lg'
            shadow='sm'
            withBorder
          >
            <Title
              mb='md'
              order={4}
            >
              Memory Utilization
            </Title>
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
                sections={[{ color: COLOR_HYPHAE, value: utilizationPct }]}
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
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <KpiCard
                accent={COLOR_HYPHAE}
                label='Created (7d)'
                value={data.lifecycle.created_last_7d.toLocaleString()}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <KpiCard
                accent={COLOR_NEUTRAL}
                label='Decayed'
                value={data.lifecycle.decayed.toLocaleString()}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <KpiCard
                accent={COLOR_NEUTRAL}
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
        <Card
          padding='lg'
          shadow='sm'
          withBorder
        >
          <Title
            mb='md'
            order={4}
          >
            Top Topics
          </Title>
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
        </Card>
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

  return (
    <Stack>
      <Text
        c='dimmed'
        size='sm'
      >
        Tree-sitter: {data.backend_usage.treesitter.toLocaleString()} calls, LSP: {data.backend_usage.lsp.toLocaleString()} calls
      </Text>

      {data.tool_calls.length > 0 && (
        <Card
          padding='lg'
          shadow='sm'
          withBorder
        >
          <Title
            mb='md'
            order={4}
          >
            Tool Call Distribution
          </Title>
          <ResponsiveContainer
            height={300}
            width='100%'
          >
            <PieChart>
              <Pie
                cx='50%'
                cy='50%'
                data={data.tool_calls}
                dataKey='count'
                label={({ name }) => name}
                nameKey='tool'
                outerRadius={100}
              >
                {data.tool_calls.map((_entry, idx) => (
                  <Cell
                    fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    key={_entry.tool}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {data.languages.length > 0 && (
        <Card
          padding='lg'
          shadow='sm'
          withBorder
        >
          <Title
            mb='md'
            order={4}
          >
            Languages
          </Title>
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
        </Card>
      )}
    </Stack>
  )
}

export function Analytics() {
  const [hyphaeData, setHyphaeData] = useState<HyphaeAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [myceliumData, setMyceliumData] = useState<MyceliumAnalytics | null>(null)
  const [rhizomeData, setRhizomeData] = useState<RhizomeAnalytics | null>(null)

  useEffect(() => {
    Promise.allSettled([
      hyphaeApi.analytics().then(setHyphaeData),
      myceliumApi.analytics().then(setMyceliumData),
      rhizomeApi.analytics().then(setRhizomeData),
    ]).finally(() => setLoading(false))
  }, [])

  const totalTokensSaved = myceliumData ? myceliumData.savings_by_category.reduce((sum, c) => sum + c.tokens_saved, 0) : null

  const memoryUtilization = hyphaeData ? Math.round(hyphaeData.memory_utilization.rate * 100) : null

  const languagesIndexed = rhizomeData?.available ? rhizomeData.languages.length : null

  return (
    <Stack>
      <Title order={2}>Analytics</Title>

      {loading && (
        <Group
          justify='center'
          mt='xl'
        >
          <Loader />
        </Group>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent={COLOR_MYCELIUM}
            label='Total Tokens Saved'
            value={totalTokensSaved != null ? totalTokensSaved.toLocaleString() : '\u2014'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent={COLOR_HYPHAE}
            label='Memory Utilization'
            value={memoryUtilization != null ? `${memoryUtilization}%` : '\u2014'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent={COLOR_RHIZOME}
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
