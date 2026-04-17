import { Badge, Group, Stack, Table, Text } from '@mantine/core'

import type { CanopyAgent } from '../../lib/types'

const FRESHNESS_COLORS: Record<string, string> = {
  expired: 'red',
  fresh: 'green',
  stale: 'yellow',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'blue',
  idle: 'gray',
  offline: 'red',
}

export function CanopyAgentsPanel({ agents }: { agents: CanopyAgent[] }) {
  if (agents.length === 0) {
    return null
  }

  return (
    <Stack gap='md'>
      <Table
        highlightOnHover
        striped
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Agent</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Freshness</Table.Th>
            <Table.Th>Model</Table.Th>
            <Table.Th>Current Task</Table.Th>
            <Table.Th>Capabilities</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {agents.map((agent) => (
            <Table.Tr key={agent.agent_id}>
              <Table.Td>
                <Text size='sm'>{agent.role}</Text>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  {agent.agent_id}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge
                  color={STATUS_COLORS[agent.status]}
                  variant='light'
                >
                  {agent.status}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge
                  color={FRESHNESS_COLORS[agent.freshness]}
                  variant='light'
                >
                  {agent.freshness}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{agent.model ? agent.model : '—'}</Text>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{agent.current_task_id ? agent.current_task_id : '—'}</Text>
              </Table.Td>
              <Table.Td>
                <Group gap='xs'>
                  {agent.capabilities.slice(0, 2).map((cap) => (
                    <Badge
                      key={cap}
                      size='sm'
                      variant='dot'
                    >
                      {cap}
                    </Badge>
                  ))}
                  {agent.capabilities.length > 2 && (
                    <Badge
                      size='sm'
                      variant='dot'
                    >
                      +{agent.capabilities.length - 2}
                    </Badge>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}
