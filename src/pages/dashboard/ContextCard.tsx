import { Badge, Card, Group, Text } from '@mantine/core'

import type { ContextEntry } from '../../lib/api'
import { relevanceColor, sourceLabel } from './dashboard-formatters'

export function ContextCard({ entry }: { entry: ContextEntry }) {
  return (
    <Card
      p='sm'
      withBorder
    >
      <Group
        justify='space-between'
        mb={4}
      >
        <Group gap='xs'>
          <Badge
            color={relevanceColor(entry.relevance)}
            size='xs'
            variant='light'
          >
            {sourceLabel(entry.source)}
          </Badge>
          {entry.topic && (
            <Text
              c='dimmed'
              size='xs'
            >
              {entry.topic}
            </Text>
          )}
          {entry.symbol && (
            <Text
              ff='monospace'
              size='xs'
            >
              {entry.symbol}
            </Text>
          )}
        </Group>
        <Text
          c='dimmed'
          size='xs'
        >
          {(entry.relevance * 100).toFixed(0)}%
        </Text>
      </Group>
      <Text size='sm'>{entry.content.length > 200 ? `${entry.content.slice(0, 200)}...` : entry.content}</Text>
    </Card>
  )
}
