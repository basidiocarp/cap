import { Alert, Badge, Button, Group, Progress, Stack, Table, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { CommandHistory, CommandHistoryEntry } from '../../lib/api'
import { ActionEmptyState } from '../../components/ActionEmptyState'
import { SectionCard } from '../../components/SectionCard'
import { timeAgo } from '../../lib/time'

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
        description='Cap could not load command history from Mycelium yet.'
        hint='This table only shows commands that were actually recorded by Mycelium. It does not try to mirror every shell command or every Claude Code or Codex turn.'
        title='Command history is unavailable'
      />
    )
  }

  if (data.total === 0) {
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
        description='Mycelium has not recorded any filtered commands yet.'
        hint='Run commands through Mycelium to populate this table. If you are already using the ecosystem, check Status to confirm Mycelium is installed and active for the project you are viewing.'
        title='No command history yet'
      />
    )
  }

  return (
    <Stack>
      <Alert
        color='mycelium'
        title='What appears here'
      >
        Command History shows the Mycelium-tracked command stream behind token filtering. If a command never passed through Mycelium, it
        will not appear here even if you ran it in the same project.
      </Alert>

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
            {data.commands.map((cmd: CommandHistoryEntry) => (
              <Table.Tr key={`${cmd.timestamp}-${cmd.command}`}>
                <Table.Td>
                  <Text
                    ff='monospace'
                    size='sm'
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
