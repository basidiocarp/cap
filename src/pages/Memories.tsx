import { Badge, Code, Group, Modal, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useState } from 'react'

import type { Memory } from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { importanceColor } from '../lib/colors'
import { parseJsonArray } from '../lib/parse'
import { useRecall, useTopicMemories, useTopics } from '../lib/queries'

export function Memories() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 400)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)

  const { data: topics = [], isLoading: topicsLoading } = useTopics()

  const recallQuery = useRecall(debouncedQuery, selectedTopic ?? undefined, 30)
  const topicQuery = useTopicMemories(selectedTopic ?? '', 50)

  const hasQuery = !!debouncedQuery.trim()
  const activeQuery = hasQuery ? recallQuery : selectedTopic ? topicQuery : null
  const memories: Memory[] = activeQuery?.data ?? []
  const loading = activeQuery?.isLoading ?? false
  const error = activeQuery?.error

  return (
    <Stack>
      <Title order={2}>Memories</Title>

      <Group>
        <TextInput
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder='Search memories...'
          style={{ flex: 1 }}
          value={query}
        />
        <Select
          clearable
          data={topics.map((t) => ({ label: `${t.topic} (${t.count})`, value: t.topic }))}
          disabled={topicsLoading}
          onChange={setSelectedTopic}
          placeholder='Filter by topic'
          value={selectedTopic}
          w={250}
        />
      </Group>

      <ErrorAlert error={error} />

      {loading && (
        <PageLoader
          mt='md'
          size='sm'
        />
      )}

      {!loading && memories.length === 0 && !error && (
        <EmptyState mt='md'>
          {debouncedQuery || selectedTopic ? 'No results found.' : 'Search or select a topic to browse memories.'}
        </EmptyState>
      )}

      {memories.length > 0 && (
        <SectionCard>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Summary</Table.Th>
                <Table.Th>Topic</Table.Th>
                <Table.Th>Importance</Table.Th>
                <Table.Th>Weight</Table.Th>
                <Table.Th>Keywords</Table.Th>
                <Table.Th>Created</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {memories.map((m) => (
                <Table.Tr
                  key={m.id}
                  onClick={() => setSelectedMemory(m)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td maw={400}>
                    <Text
                      lineClamp={2}
                      size='sm'
                    >
                      {m.summary}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size='sm'
                      variant='light'
                    >
                      {m.topic}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={importanceColor(m.importance)}
                      size='sm'
                      variant='light'
                    >
                      {m.importance}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>{m.weight.toFixed(3)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {parseJsonArray<string>(m.keywords)
                        .slice(0, 3)
                        .map((kw) => (
                          <Badge
                            key={kw}
                            size='xs'
                            variant='outline'
                          >
                            {kw}
                          </Badge>
                        ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      c='dimmed'
                      size='xs'
                    >
                      {new Date(m.created_at).toLocaleDateString()}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}

      {selectedMemory && (
        <Modal
          centered
          onClose={() => setSelectedMemory(null)}
          opened={!!selectedMemory}
          size='lg'
          title='Memory Details'
        >
          <Stack gap='md'>
            <div>
              <Text
                fw={500}
                size='sm'
              >
                Summary
              </Text>
              <Text
                c='dimmed'
                mt='xs'
                size='sm'
              >
                {selectedMemory.summary}
              </Text>
            </div>

            {selectedMemory.raw_excerpt && (
              <div>
                <Text
                  fw={500}
                  size='sm'
                >
                  Raw Excerpt
                </Text>
                <Code
                  block
                  mt='xs'
                  style={{ maxHeight: '200px', overflow: 'auto' }}
                >
                  {selectedMemory.raw_excerpt}
                </Code>
              </div>
            )}

            <Group grow>
              <div>
                <Text
                  fw={500}
                  size='sm'
                >
                  Topic
                </Text>
                <Badge
                  mt='xs'
                  variant='light'
                >
                  {selectedMemory.topic}
                </Badge>
              </div>

              <div>
                <Text
                  fw={500}
                  size='sm'
                >
                  Importance
                </Text>
                <Badge
                  color={importanceColor(selectedMemory.importance)}
                  mt='xs'
                  variant='light'
                >
                  {selectedMemory.importance}
                </Badge>
              </div>

              <div>
                <Text
                  fw={500}
                  size='sm'
                >
                  Weight
                </Text>
                <Text
                  mt='xs'
                  size='sm'
                >
                  {selectedMemory.weight.toFixed(3)}
                </Text>
              </div>
            </Group>

            <div>
              <Text
                fw={500}
                size='sm'
              >
                Keywords
              </Text>
              <Group
                gap={4}
                mt='xs'
              >
                {parseJsonArray<string>(selectedMemory.keywords).map((kw) => (
                  <Badge
                    key={kw}
                    size='sm'
                    variant='outline'
                  >
                    {kw}
                  </Badge>
                ))}
              </Group>
            </div>

            <Group grow>
              <div>
                <Text
                  fw={500}
                  size='sm'
                >
                  Created
                </Text>
                <Text
                  c='dimmed'
                  mt='xs'
                  size='xs'
                >
                  {new Date(selectedMemory.created_at).toLocaleString()}
                </Text>
              </div>

              <div>
                <Text
                  fw={500}
                  size='sm'
                >
                  Updated
                </Text>
                <Text
                  c='dimmed'
                  mt='xs'
                  size='xs'
                >
                  {new Date(selectedMemory.updated_at).toLocaleString()}
                </Text>
              </div>

              <div>
                <Text
                  fw={500}
                  size='sm'
                >
                  Last Accessed
                </Text>
                <Text
                  c='dimmed'
                  mt='xs'
                  size='xs'
                >
                  {new Date(selectedMemory.last_accessed).toLocaleString()}
                </Text>
              </div>
            </Group>

            <Group grow>
              <div>
                <Text
                  fw={500}
                  size='sm'
                >
                  Access Count
                </Text>
                <Text
                  mt='xs'
                  size='sm'
                >
                  {selectedMemory.access_count}
                </Text>
              </div>

              <div>
                <Text
                  fw={500}
                  size='sm'
                >
                  Source Type
                </Text>
                <Badge
                  mt='xs'
                  size='sm'
                  variant='outline'
                >
                  {selectedMemory.source_type}
                </Badge>
              </div>
            </Group>

            {parseJsonArray<string>(selectedMemory.related_ids).length > 0 && (
              <div>
                <Text
                  fw={500}
                  size='sm'
                >
                  Related Memory IDs
                </Text>
                <Group
                  gap={4}
                  mt='xs'
                >
                  {parseJsonArray<string>(selectedMemory.related_ids).map((id) => (
                    <Badge
                      key={id}
                      ff='monospace'
                      size='xs'
                      variant='outline'
                    >
                      {id.slice(0, 8)}...
                    </Badge>
                  ))}
                </Group>
              </div>
            )}
          </Stack>
        </Modal>
      )}
    </Stack>
  )
}
