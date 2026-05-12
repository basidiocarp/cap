import { Badge, Group, Stack, Text } from '@mantine/core'

import type { CanopyAgent } from '../../lib/types'
import { SectionCard } from '../../components/SectionCard'
import { useCanopyAgents } from '../../lib/queries'

function statusColor(status: string): string {
  switch (status) {
    case 'idle':
      return 'substrate'
    case 'active':
      return 'mycelium'
    case 'offline':
      return 'gill'
    default:
      return 'gray'
  }
}

export function LiveAgentsSection() {
  const agentsQuery = useCanopyAgents({ refetchInterval: 30_000 })
  const agents = (agentsQuery.data ?? []) as CanopyAgent[]

  if (agentsQuery.isLoading || agentsQuery.isError || agents.length === 0) {
    return null
  }

  return (
    <SectionCard title='Active Agents'>
      <Stack gap='xs'>
        {agents.map((agent) => (
          <Group
            justify='space-between'
            key={agent.agent_id}
          >
            <div>
              <Text
                fw={500}
                size='sm'
              >
                {agent.agent_id}
              </Text>
              {agent.current_task_id && (
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Task: {agent.current_task_id}
                </Text>
              )}
            </div>
            <Group gap={4}>
              <Badge
                color={statusColor(agent.status)}
                size='xs'
                variant='light'
              >
                {agent.status}
              </Badge>
            </Group>
          </Group>
        ))}
      </Stack>
    </SectionCard>
  )
}
