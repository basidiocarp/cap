import { Badge, Group, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core'
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
                <Table.Tr key={m.id}>
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
    </Stack>
  )
}
