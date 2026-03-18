import { PieChart } from '@mantine/charts'
import { Alert, Badge, Grid, Group, Stack, Table } from '@mantine/core'

import type { RhizomeAnalytics } from '../../lib/api'
import { KpiCard } from '../../components/KpiCard'
import { SectionCard } from '../../components/SectionCard'
import { PIE_COLORS } from '../../lib/colors'

export function CodeIntelligenceTab({ data }: { data: RhizomeAnalytics | null }) {
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
          <Group
            justify='center'
            mih={260}
            miw={260}
          >
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
