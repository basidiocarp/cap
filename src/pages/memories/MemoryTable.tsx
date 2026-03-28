import { Badge, Group, Progress, ScrollArea, Table, Text, Tooltip } from '@mantine/core'

import type { Memory } from '../../lib/api'
import { importanceColor } from '../../lib/colors'
import { getMemoryReviewState } from '../../lib/memory-review'
import { timeAgo } from '../../lib/time'
import { getKeywords, reviewColor, reviewLabel, topicColor, weightColor } from './memory-utils'

export function MemoryTable({ memories, onSelect }: { memories: Memory[]; onSelect: (m: Memory) => void }) {
  return (
    <ScrollArea>
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Summary</Table.Th>
            <Table.Th w={120}>Topic</Table.Th>
            <Table.Th w={110}>Review</Table.Th>
            <Table.Th w={90}>Importance</Table.Th>
            <Table.Th w={80}>Weight</Table.Th>
            <Table.Th>Keywords</Table.Th>
            <Table.Th w={80}>Age</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {memories.map((memory) => {
            const review = getMemoryReviewState(memory)

            return (
              <Table.Tr
                key={memory.id}
                onClick={() => onSelect(memory)}
                style={{
                  cursor: 'pointer',
                  opacity: review.kind === 'invalidated' ? 0.7 : 1,
                }}
              >
                <Table.Td maw={400}>
                  <Text
                    lineClamp={2}
                    size='sm'
                  >
                    {memory.summary}
                  </Text>
                  {review.kind !== 'active' ? (
                    <Group
                      gap={6}
                      mt={6}
                    >
                      <Badge
                        color={reviewColor(review.kind)}
                        size='xs'
                        variant='light'
                      >
                        {reviewLabel(review.kind)}
                      </Badge>
                      <Text
                        c='dimmed'
                        lineClamp={1}
                        size='xs'
                      >
                        {review.description}
                      </Text>
                    </Group>
                  ) : null}
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={topicColor(memory.topic)}
                    size='xs'
                    variant='light'
                  >
                    {memory.topic}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={reviewColor(review.kind)}
                    size='xs'
                    variant={review.kind === 'active' ? 'outline' : 'light'}
                  >
                    {reviewLabel(review.kind)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={importanceColor(memory.importance)}
                    size='xs'
                    variant='light'
                  >
                    {memory.importance}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Tooltip label={`Weight: ${memory.weight.toFixed(3)}`}>
                    <Progress
                      color={weightColor(memory.weight)}
                      size='sm'
                      value={memory.weight * 100}
                    />
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {getKeywords(memory.keywords)
                      .slice(0, 3)
                      .map((keyword) => (
                        <Badge
                          key={keyword}
                          size='xs'
                          variant='outline'
                        >
                          {keyword}
                        </Badge>
                      ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Tooltip label={new Date(memory.created_at).toLocaleString()}>
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      {timeAgo(memory.created_at)}
                    </Text>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  )
}
