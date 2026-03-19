import {
  Badge,
  Card,
  Code,
  Grid,
  Group,
  Modal,
  Progress,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
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

function topicIcon(topic: string): string {
  if (topic.startsWith('errors/')) return 'E'
  if (topic.startsWith('session/')) return 'S'
  if (topic.startsWith('decisions/')) return 'D'
  if (topic.startsWith('context/')) return 'C'
  if (topic.startsWith('corrections')) return 'X'
  if (topic.startsWith('tests/')) return 'T'
  if (topic.startsWith('reviews/')) return 'R'
  if (topic.startsWith('preferences')) return 'P'
  return topic.charAt(0).toUpperCase()
}

function topicColor(topic: string): string {
  if (topic.startsWith('errors/')) return 'red'
  if (topic.startsWith('session/')) return 'substrate'
  if (topic.startsWith('decisions/')) return 'mycelium'
  if (topic.startsWith('context/')) return 'lichen'
  if (topic.startsWith('corrections')) return 'orange'
  if (topic.startsWith('tests/')) return 'spore'
  if (topic.startsWith('reviews/')) return 'fruiting'
  return 'gray'
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory table
// ─────────────────────────────────────────────────────────────────────────────

function MemoryTable({ memories, onSelect }: { memories: Memory[]; onSelect: (m: Memory) => void }) {
  return (
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
              onClick={() => onSelect(m)}
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
                  color={topicColor(m.topic)}
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
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory detail modal
// ─────────────────────────────────────────────────────────────────────────────

function MemoryDetailModal({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  return (
    <Modal
      centered
      onClose={onClose}
      opened
      size='lg'
      title={
        <Group gap='sm'>
          <Text fw={600}>Memory Detail</Text>
          <Badge
            color={importanceColor(memory.importance)}
            size='sm'
            variant='light'
          >
            {memory.importance}
          </Badge>
        </Group>
      }
    >
      <Stack gap='md'>
        <SectionCard
          bg='chitin.9'
          padding='sm'
        >
          <Text
            c='gray.2'
            size='sm'
          >
            {memory.summary}
          </Text>
        </SectionCard>

        {memory.raw_excerpt && (
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
              {memory.raw_excerpt}
            </Code>
          </div>
        )}

        <Grid>
          <Grid.Col span={4}>
            <Text
              c='dimmed'
              size='xs'
            >
              Topic
            </Text>
            <Badge
              color={topicColor(memory.topic)}
              mt={4}
              size='sm'
              variant='light'
            >
              {memory.topic}
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
                color={weightColor(memory.weight)}
                size='sm'
                style={{ flex: 1 }}
                value={memory.weight * 100}
              />
              <Text size='xs'>{memory.weight.toFixed(3)}</Text>
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
              {memory.access_count}x
            </Text>
          </Grid.Col>
        </Grid>

        {getKeywords(memory.keywords).length > 0 && (
          <div>
            <Text
              c='dimmed'
              mb={4}
              size='xs'
            >
              Keywords
            </Text>
            <Group gap={4}>
              {getKeywords(memory.keywords).map((kw) => (
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

        <Grid>
          <Grid.Col span={4}>
            <Text
              c='dimmed'
              size='xs'
            >
              Created
            </Text>
            <Text size='xs'>{timeAgo(memory.created_at)}</Text>
            <Text
              c='dimmed'
              size='xs'
            >
              {new Date(memory.created_at).toLocaleString()}
            </Text>
          </Grid.Col>
          <Grid.Col span={4}>
            <Text
              c='dimmed'
              size='xs'
            >
              Updated
            </Text>
            <Text size='xs'>{timeAgo(memory.updated_at)}</Text>
          </Grid.Col>
          <Grid.Col span={4}>
            <Text
              c='dimmed'
              size='xs'
            >
              Last Accessed
            </Text>
            <Text size='xs'>{timeAgo(memory.last_accessed)}</Text>
          </Grid.Col>
        </Grid>

        {memory.source_type && (
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
              {memory.source_type}
            </Badge>
          </div>
        )}

        {getRelatedIds(memory.related_ids).length > 0 && (
          <div>
            <Text
              c='dimmed'
              mb={4}
              size='xs'
            >
              Related Memories
            </Text>
            <Group gap={4}>
              {getRelatedIds(memory.related_ids).map((id) => (
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
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
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

  const showBrowseView = !hasQuery && !selectedTopic && !loading

  function handleTopicClick(topic: string) {
    setSelectedTopic(topic)
    setQuery('')
  }

  function handleClearFilters() {
    setSelectedTopic(null)
    setQuery('')
  }

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

      {/* Search + filter bar */}
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
        {(selectedTopic || hasQuery) && (
          <UnstyledButton onClick={handleClearFilters}>
            <Text
              c='dimmed'
              size='sm'
              td='underline'
            >
              Clear all
            </Text>
          </UnstyledButton>
        )}
      </Group>

      <ErrorAlert error={error} />

      {/* Default browse view: topic cards */}
      {showBrowseView && (
        <>
          {topicsLoading && <PageLoader size='sm' />}

          {!topicsLoading && topics.length === 0 && (
            <EmptyState mt='md'>No memories stored yet. Memories are created automatically during agent sessions.</EmptyState>
          )}

          {!topicsLoading && topics.length > 0 && (
            <SimpleGrid cols={{ base: 2, lg: 4, md: 3 }}>
              {topics.map((t) => (
                <UnstyledButton
                  key={t.topic}
                  onClick={() => handleTopicClick(t.topic)}
                  style={{ width: '100%' }}
                >
                  <Card
                    padding='md'
                    radius='md'
                    shadow='sm'
                    withBorder
                  >
                    <Group
                      gap='sm'
                      mb='xs'
                    >
                      <Badge
                        color={topicColor(t.topic)}
                        size='lg'
                        variant='light'
                        w={36}
                      >
                        {topicIcon(t.topic)}
                      </Badge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          fw={500}
                          lineClamp={1}
                          size='sm'
                        >
                          {t.topic}
                        </Text>
                      </div>
                    </Group>
                    <Group justify='space-between'>
                      <Text
                        c='dimmed'
                        size='xs'
                      >
                        {t.count} {t.count === 1 ? 'memory' : 'memories'}
                      </Text>
                      <Tooltip label={`Avg weight: ${t.avg_weight.toFixed(2)}`}>
                        <Progress
                          color={weightColor(t.avg_weight)}
                          size='xs'
                          value={t.avg_weight * 100}
                          w={50}
                        />
                      </Tooltip>
                    </Group>
                    <Text
                      c='dimmed'
                      mt={4}
                      size='xs'
                    >
                      Latest: {timeAgo(t.newest)}
                    </Text>
                  </Card>
                </UnstyledButton>
              ))}
            </SimpleGrid>
          )}
        </>
      )}

      {/* Active topic indicator */}
      {selectedTopic && !hasQuery && (
        <Group gap='xs'>
          <Text
            c='dimmed'
            size='sm'
          >
            Browsing:
          </Text>
          <Badge
            color={topicColor(selectedTopic)}
            size='lg'
            variant='light'
          >
            {selectedTopic}
          </Badge>
        </Group>
      )}

      {/* Loading */}
      {loading && (
        <PageLoader
          mt='md'
          size='sm'
        />
      )}

      {/* No results */}
      {!loading && !showBrowseView && memories.length === 0 && !error && (
        <EmptyState mt='md'>No results found.</EmptyState>
      )}

      {/* Results table */}
      {memories.length > 0 && (
        <SectionCard>
          <MemoryTable
            memories={memories}
            onSelect={setSelectedMemory}
          />
        </SectionCard>
      )}

      {/* Detail modal */}
      {selectedMemory && (
        <MemoryDetailModal
          memory={selectedMemory}
          onClose={() => setSelectedMemory(null)}
        />
      )}
    </Stack>
  )
}
