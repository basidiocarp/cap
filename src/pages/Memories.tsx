import {
  Badge,
  Code,
  Grid,
  Group,
  Modal,
  Progress,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useState } from 'react'

import type { Memory } from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { importanceColor } from '../lib/colors'
import { parseJsonArray } from '../lib/parse'
import { useRecall, useTopicMemories, useTopics } from '../lib/queries'

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
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function weightColor(weight: number): string {
  if (weight >= 0.7) return 'mycelium'
  if (weight >= 0.4) return 'yellow'
  if (weight >= 0.2) return 'orange'
  return 'red'
}

function getKeywords(kw: unknown): string[] {
  if (Array.isArray(kw)) return kw
  if (typeof kw === 'string') return parseJsonArray<string>(kw)
  return []
}

function getRelatedIds(ids: unknown): string[] {
  if (Array.isArray(ids)) return ids
  if (typeof ids === 'string') return parseJsonArray<string>(ids)
  return []
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

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
      <Group justify='space-between'>
        <Title order={2}>Memories</Title>
        {memories.length > 0 && (
          <Badge
            size='lg'
            variant='light'
          >
            {memories.length} results
          </Badge>
        )}
      </Group>

      <Group>
        <TextInput
          leftSection={<IconSearch size={16} />}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder='Search memories...'
          rightSection={
            query ? (
              <IconX
                onClick={() => setQuery('')}
                size={14}
                style={{ cursor: 'pointer' }}
              />
            ) : null
          }
          style={{ flex: 1 }}
          value={query}
        />
        <Select
          clearable
          data={topics.map((t) => ({ label: `${t.topic} (${t.count})`, value: t.topic }))}
          disabled={topicsLoading}
          onChange={setSelectedTopic}
          placeholder='Filter by topic'
          searchable
          value={selectedTopic}
          w={280}
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
          <ScrollArea>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Summary</Table.Th>
                  <Table.Th w={120}>Topic</Table.Th>
                  <Table.Th w={90}>Importance</Table.Th>
                  <Table.Th w={80}>Weight</Table.Th>
                  <Table.Th>Keywords</Table.Th>
                  <Table.Th w={80}>Age</Table.Th>
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
                        color='substrate'
                        size='xs'
                        variant='light'
                      >
                        {m.topic}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={importanceColor(m.importance)}
                        size='xs'
                        variant='light'
                      >
                        {m.importance}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label={`Weight: ${m.weight.toFixed(3)}`}>
                        <Progress
                          color={weightColor(m.weight)}
                          size='sm'
                          value={m.weight * 100}
                        />
                      </Tooltip>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {getKeywords(m.keywords)
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
                      <Tooltip label={new Date(m.created_at).toLocaleString()}>
                        <Text
                          c='dimmed'
                          size='xs'
                        >
                          {timeAgo(m.created_at)}
                        </Text>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </SectionCard>
      )}

      {selectedMemory && (
        <Modal
          centered
          onClose={() => setSelectedMemory(null)}
          opened={!!selectedMemory}
          size='lg'
          title={
            <Group gap='sm'>
              <Text fw={600}>Memory Detail</Text>
              <Badge
                color={importanceColor(selectedMemory.importance)}
                size='sm'
                variant='light'
              >
                {selectedMemory.importance}
              </Badge>
            </Group>
          }
        >
          <Stack gap='md'>
            {/* Summary */}
            <SectionCard
              bg='chitin.9'
              padding='sm'
            >
              <Text
                c='gray.2'
                size='sm'
              >
                {selectedMemory.summary}
              </Text>
            </SectionCard>

            {/* Raw excerpt */}
            {selectedMemory.raw_excerpt && (
              <div>
                <Text
                  c='dimmed'
                  mb={4}
                  size='xs'
                >
                  Raw Excerpt
                </Text>
                <Code
                  block
                  style={{ maxHeight: 200, overflow: 'auto' }}
                >
                  {selectedMemory.raw_excerpt}
                </Code>
              </div>
            )}

            {/* Metadata grid */}
            <Grid>
              <Grid.Col span={4}>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Topic
                </Text>
                <Badge
                  color='substrate'
                  mt={4}
                  size='sm'
                  variant='light'
                >
                  {selectedMemory.topic}
                </Badge>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Weight
                </Text>
                <Group
                  gap='xs'
                  mt={4}
                >
                  <Progress
                    color={weightColor(selectedMemory.weight)}
                    size='sm'
                    style={{ flex: 1 }}
                    value={selectedMemory.weight * 100}
                  />
                  <Text size='xs'>{selectedMemory.weight.toFixed(3)}</Text>
                </Group>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Accessed
                </Text>
                <Text
                  mt={4}
                  size='sm'
                >
                  {selectedMemory.access_count}x
                </Text>
              </Grid.Col>
            </Grid>

            {/* Keywords */}
            {getKeywords(selectedMemory.keywords).length > 0 && (
              <div>
                <Text
                  c='dimmed'
                  mb={4}
                  size='xs'
                >
                  Keywords
                </Text>
                <Group gap={4}>
                  {getKeywords(selectedMemory.keywords).map((kw) => (
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
            )}

            {/* Timestamps */}
            <Grid>
              <Grid.Col span={4}>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Created
                </Text>
                <Text size='xs'>{timeAgo(selectedMemory.created_at)}</Text>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  {new Date(selectedMemory.created_at).toLocaleString()}
                </Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Updated
                </Text>
                <Text size='xs'>{timeAgo(selectedMemory.updated_at)}</Text>
              </Grid.Col>
              <Grid.Col span={4}>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  Last Accessed
                </Text>
                <Text size='xs'>{timeAgo(selectedMemory.last_accessed)}</Text>
              </Grid.Col>
            </Grid>

            {/* Source + related */}
            <Group>
              {selectedMemory.source_type && (
                <div>
                  <Text
                    c='dimmed'
                    size='xs'
                  >
                    Source
                  </Text>
                  <Badge
                    mt={4}
                    size='xs'
                    variant='outline'
                  >
                    {selectedMemory.source_type}
                  </Badge>
                </div>
              )}
            </Group>

            {getRelatedIds(selectedMemory.related_ids).length > 0 && (
              <div>
                <Text
                  c='dimmed'
                  mb={4}
                  size='xs'
                >
                  Related Memories
                </Text>
                <Group gap={4}>
                  {getRelatedIds(selectedMemory.related_ids).map((id) => (
                    <Badge
                      ff='monospace'
                      key={id}
                      size='xs'
                      variant='outline'
                    >
                      {id.slice(0, 8)}
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
