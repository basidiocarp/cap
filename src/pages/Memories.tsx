import { Alert, Badge, Card, Group, Loader, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useCallback, useEffect, useState } from 'react'

import type { Memory, TopicSummary } from '../lib/api'
import { hyphaeApi } from '../lib/api'

function parseKeywords(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

function importanceColor(importance: string): string {
  switch (importance) {
    case 'Critical':
      return 'gill'
    case 'High':
      return 'fruiting'
    case 'Medium':
      return 'lichen'
    case 'Low':
      return 'chitin'
    default:
      return 'chitin'
  }
}

export function Memories() {
  const [topics, setTopics] = useState<TopicSummary[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 400)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(false)
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    hyphaeApi
      .topics()
      .then(setTopics)
      .catch(() => {})
      .finally(() => setTopicsLoading(false))
  }, [])

  const search = useCallback(async () => {
    setError(null)
    if (debouncedQuery.trim()) {
      setLoading(true)
      try {
        const data = await hyphaeApi.recall(debouncedQuery, selectedTopic ?? undefined, 30)
        setMemories(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    } else if (selectedTopic) {
      setLoading(true)
      try {
        const data = await hyphaeApi.topicMemories(selectedTopic, 50)
        setMemories(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load memories')
      } finally {
        setLoading(false)
      }
    } else {
      setMemories([])
    }
  }, [debouncedQuery, selectedTopic])

  useEffect(() => {
    search()
  }, [search])

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

      {error && (
        <Alert
          color='decay'
          title='Error'
        >
          {error}
        </Alert>
      )}

      {loading && (
        <Group
          justify='center'
          mt='md'
        >
          <Loader size='sm' />
        </Group>
      )}

      {!loading && memories.length === 0 && !error && (
        <Text
          c='dimmed'
          mt='md'
        >
          {debouncedQuery || selectedTopic ? 'No results found.' : 'Search or select a topic to browse memories.'}
        </Text>
      )}

      {memories.length > 0 && (
        <Card
          padding='lg'
          shadow='sm'
          withBorder
        >
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
                      {parseKeywords(m.keywords)
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
        </Card>
      )}
    </Stack>
  )
}
