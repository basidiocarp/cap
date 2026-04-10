import { BarChart } from '@mantine/charts'
import { Alert, Badge, Button, Grid, Group, Stack, Table, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { RhizomeAnalytics } from '../../lib/api'
import { ActionEmptyState } from '../../components/ActionEmptyState'
import { KpiCard } from '../../components/KpiCard'
import { SectionCard } from '../../components/SectionCard'
import { ChartBox } from './ChartBox'

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)} s`
  return `${Math.round(ms / 1000)} s`
}

export function CodeIntelligenceTab({ data }: { data: RhizomeAnalytics | null }) {
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
        description='Cap could not load Rhizome analytics yet.'
        hint='This tab only measures Rhizome’s code intelligence backend. It does not summarize all code work in the project.'
        title='Code intelligence analytics are unavailable'
      />
    )
  }

  if (!data.available) {
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
              to='/settings'
              variant='subtle'
            >
              Open settings
            </Button>
          </>
        }
        description='Rhizome is not installed or not reachable, so there is no code intelligence history to show yet.'
        hint='Install or repair Rhizome first, then return here for supported tools, backend status, and language coverage.'
        title='Rhizome is unavailable'
      />
    )
  }

  const backendSummary =
    data.backend_usage.lsp && data.backend_usage.treesitter
      ? 'Mixed backend support'
      : data.backend_usage.lsp
        ? 'LSP only'
        : data.backend_usage.treesitter
          ? 'Tree-sitter only'
          : 'No backend coverage'
  const toolCalls = [...data.tool_calls].sort((a, b) => b.count - a.count || a.tool.localeCompare(b.tool))
  const totalCalls = toolCalls.reduce((sum, tool) => sum + tool.count, 0)
  const weightedAverageDuration =
    totalCalls > 0 ? toolCalls.reduce((sum, tool) => sum + tool.avg_duration_ms * tool.count, 0) / totalCalls : 0

  return (
    <Stack>
      <Alert
        color='lichen'
        title='How to read code intelligence analytics'
      >
        These charts describe Rhizome itself: which code tools are exposed, which backends are active, and what language support is
        currently configured. They do not attempt to estimate overall engineering activity.
      </Alert>

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
            value={backendSummary}
          >
            <Group
              gap='xs'
              mt='xs'
            >
              <Badge
                color={data.backend_usage.treesitter ? 'mycelium' : 'decay'}
                size='xs'
                variant='light'
              >
                Tree-sitter
              </Badge>
              <Badge
                color={data.backend_usage.lsp ? 'mycelium' : 'decay'}
                size='xs'
                variant='light'
              >
                LSP
              </Badge>
            </Group>
            <Text
              c='dimmed'
              mt='xs'
              size='xs'
            >
              Backend state is shown directly. Mixed support is not collapsed into a single label.
            </Text>
          </KpiCard>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='fruiting.6'
            label='Weighted Avg Duration'
            value={formatDuration(weightedAverageDuration)}
          >
            <Text
              c='dimmed'
              mt='xs'
              size='xs'
            >
              Across {totalCalls.toLocaleString()} tool calls
            </Text>
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
        <SectionCard title='Tool Call Comparison'>
          <ChartBox mih={280}>
            <BarChart
              data={toolCalls}
              dataKey='tool'
              h={280}
              series={[{ color: 'fruiting.6', name: 'count' }]}
            />
          </ChartBox>
          <Text
            c='dimmed'
            size='xs'
          >
            Tool calls are sorted by volume so the chart stays readable as the set grows. Average duration stays in the table below.
          </Text>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tool</Table.Th>
                <Table.Th>Calls</Table.Th>
                <Table.Th>Avg Duration</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {toolCalls.map((tool) => (
                <Table.Tr key={tool.tool}>
                  <Table.Td>{tool.tool}</Table.Td>
                  <Table.Td>{tool.count.toLocaleString()}</Table.Td>
                  <Table.Td>{formatDuration(tool.avg_duration_ms)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
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
