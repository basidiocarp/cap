import { Badge, Divider, Group, Stack, Text } from '@mantine/core'

import type { CanopyTaskDetail } from '../../../lib/api'
import { EmptyState } from '../../../components/EmptyState'
import { SectionCard } from '../../../components/SectionCard'

export function TaskCouncilSection({ messages }: { messages: CanopyTaskDetail['messages'] }) {
  return (
    <>
      <Divider label='Council' />
      {messages.length > 0 ? (
        <Stack gap='xs'>
          {messages.map((message) => (
            <SectionCard
              key={message.message_id}
              p='sm'
            >
              <Stack gap={4}>
                <Group gap='xs'>
                  <Badge
                    color='blue'
                    size='xs'
                    variant='light'
                  >
                    {message.message_type}
                  </Badge>
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    {message.author_agent_id}
                  </Text>
                </Group>
                <Text size='sm'>{message.body}</Text>
              </Stack>
            </SectionCard>
          ))}
        </Stack>
      ) : (
        <EmptyState>No Council messages for this task.</EmptyState>
      )}
    </>
  )
}
