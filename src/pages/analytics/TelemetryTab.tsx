import { BarChart, LineChart } from '@mantine/charts'
import { Alert, Badge, Grid, Stack, Table, Text } from '@mantine/core'

import type { AggregateTelemetry } from '../../lib/types'
import { KpiCard } from '../../components/KpiCard'
import { SectionCard } from '../../components/SectionCard'
import { ChartBox } from './ChartBox'

export function TelemetryTab({ data }: { data: AggregateTelemetry | null }) {
  if (!data) {
    return (
      <Alert
        color='yellow'
        title='Unavailable'
      >
        Telemetry data is not available.
      </Alert>
    )
  }

  return (
    <Stack>
      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <KpiCard
            accent='chitin.5'
            label='Total Sessions'
            value={data.total_sessions.toLocaleString()}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <KpiCard
            accent='fruiting.6'
            label='Total Tool Calls'
            value={data.total_tool_calls.toLocaleString()}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <KpiCard
            accent='mycelium.7'
            label='Total Messages'
            value={data.total_messages.toLocaleString()}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <KpiCard
            accent='spore.6'
            label='Avg Session Length'
            value={data.avg_session_length.toFixed(1)}
          >
            <Text
              c='dimmed'
              mt='xs'
              size='xs'
            >
              messages per session
            </Text>
          </KpiCard>
        </Grid.Col>
      </Grid>

      {data.sessions_by_day.length > 0 && (
        <SectionCard title='Sessions Over Time'>
          <ChartBox>
            <LineChart
              curveType='monotone'
              data={data.sessions_by_day}
              dataKey='date'
              h={300}
              series={[{ color: 'chitin.5', name: 'count' }]}
              strokeWidth={2}
            />
          </ChartBox>
        </SectionCard>
      )}

      <Grid>
        {data.most_active_project && (
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SectionCard title='Most Active Project'>
              <Badge
                color='spore.6'
                size='lg'
              >
                {data.most_active_project}
              </Badge>
            </SectionCard>
          </Grid.Col>
        )}
      </Grid>

      {data.most_used_tools.length > 0 && (
        <SectionCard title='Most Used Tools'>
          <ChartBox>
            <BarChart
              data={data.most_used_tools}
              dataKey='tool'
              h={300}
              series={[{ color: 'fruiting.6', name: 'count' }]}
            />
          </ChartBox>
        </SectionCard>
      )}

      {data.most_edited_files.length > 0 && (
        <SectionCard title='Most Edited Files'>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>File</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Edits</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Reads</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.most_edited_files.map((file) => (
                <Table.Tr key={file.file}>
                  <Table.Td>
                    <Text
                      lineClamp={1}
                      size='sm'
                    >
                      {file.file}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{file.edits.toLocaleString()}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{file.reads.toLocaleString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}

      {data.most_run_commands.length > 0 && (
        <SectionCard title='Most Run Commands'>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Command</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Count</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.most_run_commands.map((cmd) => (
                <Table.Tr key={cmd.command}>
                  <Table.Td>
                    <Text
                      c='var(--mantine-color-gray-6)'
                      ff='monospace'
                      size='sm'
                    >
                      {cmd.command}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>{cmd.count.toLocaleString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}
    </Stack>
  )
}
