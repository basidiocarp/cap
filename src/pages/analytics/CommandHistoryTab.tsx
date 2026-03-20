import { Alert, Progress, Stack, Table, Text } from '@mantine/core'
import { Badge, Group } from '@mantine/core'

import type { CommandHistory, CommandHistoryEntry } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function savingsColor(pct: number): string {
  if (pct >= 80) return 'mycelium'
  if (pct >= 60) return 'yellow'
  if (pct >= 40) return 'orange'
  return 'gray'
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CommandHistoryTab({ data }: { data: CommandHistory | null }) {
  if (!data) {
    return (
      <Alert
        color='yellow'
        title='Unavailable'
      >
        Command history data is not available. Run commands with mycelium to populate this view.
      </Alert>
    )
  }

  if (data.total === 0) {
    return (
      <Alert
        color='blue'
        title='No History'
      >
        No command history available yet. Use mycelium to filter commands and history will be recorded.
      </Alert>
    )
  }

  return (
    <Stack>
      <SectionCard title={`Recent Commands (${data.total})`}>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Command</Table.Th>
              <Table.Th>Original Tokens</Table.Th>
              <Table.Th>Filtered Tokens</Table.Th>
              <Table.Th>Savings</Table.Th>
              <Table.Th>Time</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.commands.map((cmd: CommandHistoryEntry, idx: number) => (
              <Table.Tr key={idx}>
                <Table.Td>
                  <Text
                    size='sm'
                    ff='monospace'
                  >
                    {cmd.command}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{cmd.original_tokens.toLocaleString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size='sm'>{cmd.filtered_tokens.toLocaleString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap='xs'>
                    <Progress
                      color={savingsColor(cmd.savings_pct)}
                      size='sm'
                      value={cmd.savings_pct}
                      w={60}
                    />
                    <Badge
                      color={savingsColor(cmd.savings_pct)}
                      size='xs'
                      variant='light'
                    >
                      {cmd.savings_pct.toFixed(0)}%
                    </Badge>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text
                    c='dimmed'
                    size='xs'
                  >
                    {timeAgo(cmd.timestamp)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </SectionCard>
    </Stack>
  )
}
