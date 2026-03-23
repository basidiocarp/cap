import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Grid,
  Group,
  Modal,
  Progress,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconAlertCircle, IconSearch, IconTrash, IconX } from '@tabler/icons-react'
import { useState } from 'react'

import type { Memory } from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { importanceColor } from '../lib/colors'
import { getMemoryReviewState } from '../lib/memory-review'
import { parseJsonArray } from '../lib/parse'
import {
  useDeleteMemory,
  useIngestionSources,
  useInvalidateMemory,
  useMemory,
  useRecall,
  useSearchGlobal,
  useTopicMemories,
  useTopics,
  useUpdateImportance,
} from '../lib/queries'

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

function reviewColor(kind: 'active' | 'invalidated' | 'stale'): string {
  if (kind === 'invalidated') return 'red'
  if (kind === 'stale') return 'yellow'
  return 'gray'
}

function reviewLabel(kind: 'active' | 'invalidated' | 'stale'): string {
  if (kind === 'invalidated') return 'Invalidated'
  if (kind === 'stale') return 'Stale'
  return 'Active'
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
            <Table.Th w={110}>Review</Table.Th>
            <Table.Th w={90}>Importance</Table.Th>
            <Table.Th w={80}>Weight</Table.Th>
            <Table.Th>Keywords</Table.Th>
            <Table.Th w={80}>Age</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {memories.map((m) => {
            const review = getMemoryReviewState(m)

            return (
              <Table.Tr
                key={m.id}
                onClick={() => onSelect(m)}
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
                    {m.summary}
                  </Text>
                  {review.kind !== 'active' && (
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
                  )}
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
                    color={reviewColor(review.kind)}
                    size='xs'
                    variant={review.kind === 'active' ? 'outline' : 'light'}
                  >
                    {reviewLabel(review.kind)}
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
            )
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory detail modal
// ─────────────────────────────────────────────────────────────────────────────

function MemoryDetailModal({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showInvalidateForm, setShowInvalidateForm] = useState(false)
  const [invalidateReason, setInvalidateReason] = useState('')
  const deleteMemory = useDeleteMemory()
  const invalidateMemory = useInvalidateMemory()
  const { data: freshMemory } = useMemory(memory.id)
  const updateImportance = useUpdateImportance()
  const detail = freshMemory ?? memory
  const review = getMemoryReviewState(detail)

  const handleDelete = async () => {
    try {
      await deleteMemory.mutateAsync(detail.id)
      setShowConfirmDelete(false)
      onClose()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleImportanceChange = async (importance: string | null) => {
    if (importance) {
      try {
        await updateImportance.mutateAsync({ id: detail.id, importance })
      } catch (err) {
        console.error('Update importance failed:', err)
      }
    }
  }

  const handleInvalidate = async () => {
    try {
      await invalidateMemory.mutateAsync({
        id: detail.id,
        reason: invalidateReason.trim() || undefined,
      })
      setShowInvalidateForm(false)
      setInvalidateReason('')
    } catch (err) {
      console.error('Invalidate failed:', err)
    }
  }

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
            color={importanceColor(detail.importance)}
            size='sm'
            variant='light'
          >
            {detail.importance}
          </Badge>
        </Group>
      }
    >
      <Stack gap='md'>
        <Alert
          color={reviewColor(review.kind)}
          icon={<IconAlertCircle size={16} />}
          title={`${reviewLabel(review.kind)} memory`}
        >
          <Stack gap={4}>
            <Text size='sm'>{review.description}</Text>
            {detail.invalidated_at && (
              <Text size='xs'>
                Invalidated {timeAgo(detail.invalidated_at)} on {new Date(detail.invalidated_at).toLocaleString()}
              </Text>
            )}
            {detail.invalidated_by && <Text size='xs'>Invalidated by {detail.invalidated_by}</Text>}
            {detail.superseded_by_memory_id && <Text size='xs'>Superseded by memory {detail.superseded_by_memory_id.slice(0, 8)}</Text>}
          </Stack>
        </Alert>

        <SectionCard
          bg='chitin.9'
          padding='sm'
        >
          <Text
            c='gray.2'
            size='sm'
          >
            {detail.summary}
          </Text>
        </SectionCard>

        {detail.raw_excerpt && (
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
              {detail.raw_excerpt}
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
              color={topicColor(detail.topic)}
              mt={4}
              size='sm'
              variant='light'
            >
              {detail.topic}
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
                color={weightColor(detail.weight)}
                size='sm'
                style={{ flex: 1 }}
                value={detail.weight * 100}
              />
              <Text size='xs'>{detail.weight.toFixed(3)}</Text>
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
              {detail.access_count}x
            </Text>
          </Grid.Col>
        </Grid>

        {getKeywords(detail.keywords).length > 0 && (
          <div>
            <Text
              c='dimmed'
              mb={4}
              size='xs'
            >
              Keywords
            </Text>
            <Group gap={4}>
              {getKeywords(detail.keywords).map((kw) => (
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
            <Text size='xs'>{timeAgo(detail.created_at)}</Text>
            <Text
              c='dimmed'
              size='xs'
            >
              {new Date(detail.created_at).toLocaleString()}
            </Text>
          </Grid.Col>
          <Grid.Col span={4}>
            <Text
              c='dimmed'
              size='xs'
            >
              Updated
            </Text>
            <Text size='xs'>{timeAgo(detail.updated_at)}</Text>
          </Grid.Col>
          <Grid.Col span={4}>
            <Text
              c='dimmed'
              size='xs'
            >
              Last Accessed
            </Text>
            <Text size='xs'>{timeAgo(detail.last_accessed)}</Text>
          </Grid.Col>
        </Grid>

        {detail.source_type && (
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
              {detail.source_type}
            </Badge>
          </div>
        )}

        {getRelatedIds(detail.related_ids).length > 0 && (
          <div>
            <Text
              c='dimmed'
              mb={4}
              size='xs'
            >
              Related Memories
            </Text>
            <Group gap={4}>
              {getRelatedIds(detail.related_ids).map((id) => (
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

        <div style={{ borderTop: '1px solid var(--mantine-color-dark-6)', paddingTop: 'var(--mantine-spacing-md)' }}>
          <Stack gap='sm'>
            <Select
              clearable
              data={['critical', 'high', 'medium', 'low', 'ephemeral']}
              disabled={updateImportance.isPending}
              label='Importance'
              onChange={handleImportanceChange}
              placeholder='Update importance...'
              size='sm'
              value={detail.importance}
            />

            <Stack gap='xs'>
              <Text
                c='dimmed'
                size='xs'
              >
                Review
              </Text>
              {detail.invalidated_at ? (
                <SectionCard
                  bg='red.9'
                  padding='sm'
                >
                  <Stack gap={4}>
                    <Group gap='xs'>
                      <Badge
                        color='red'
                        size='sm'
                        variant='light'
                      >
                        Invalidated
                      </Badge>
                      <Text size='sm'>{detail.invalidation_reason || 'No reason captured.'}</Text>
                    </Group>
                    <Text size='xs'>Invalidated {new Date(detail.invalidated_at).toLocaleString()}</Text>
                  </Stack>
                </SectionCard>
              ) : showInvalidateForm ? (
                <>
                  <Textarea
                    autosize
                    disabled={invalidateMemory.isPending}
                    label='Invalidation reason'
                    minRows={2}
                    onChange={(event) => setInvalidateReason(event.currentTarget.value)}
                    placeholder='Why should this memory stop being reused?'
                    value={invalidateReason}
                  />
                  <Group gap='xs'>
                    <Button
                      color='red'
                      disabled={invalidateMemory.isPending}
                      onClick={handleInvalidate}
                      size='sm'
                    >
                      {invalidateMemory.isPending ? 'Invalidating...' : 'Confirm Invalidate'}
                    </Button>
                    <Button
                      disabled={invalidateMemory.isPending}
                      onClick={() => {
                        setInvalidateReason('')
                        setShowInvalidateForm(false)
                      }}
                      size='sm'
                      variant='light'
                    >
                      Cancel
                    </Button>
                  </Group>
                </>
              ) : (
                <Button
                  color='yellow'
                  onClick={() => setShowInvalidateForm(true)}
                  size='sm'
                  variant='light'
                >
                  Mark as Invalidated
                </Button>
              )}
            </Stack>

            {deleteMemory.isError && (
              <Alert
                color='red'
                icon={<IconAlertCircle size={16} />}
                title='Error'
              >
                {deleteMemory.error instanceof Error ? deleteMemory.error.message : 'Failed to delete memory'}
              </Alert>
            )}

            {updateImportance.isError && (
              <Alert
                color='red'
                icon={<IconAlertCircle size={16} />}
                title='Error'
              >
                {updateImportance.error instanceof Error ? updateImportance.error.message : 'Failed to update importance'}
              </Alert>
            )}

            {invalidateMemory.isError && (
              <Alert
                color='red'
                icon={<IconAlertCircle size={16} />}
                title='Error'
              >
                {invalidateMemory.error instanceof Error ? invalidateMemory.error.message : 'Failed to invalidate memory'}
              </Alert>
            )}

            {showConfirmDelete ? (
              <Group gap='xs'>
                <Button
                  color='red'
                  disabled={deleteMemory.isPending}
                  onClick={handleDelete}
                  size='sm'
                  variant='filled'
                >
                  {deleteMemory.isPending ? 'Deleting...' : 'Confirm Delete'}
                </Button>
                <Button
                  disabled={deleteMemory.isPending}
                  onClick={() => setShowConfirmDelete(false)}
                  size='sm'
                  variant='light'
                >
                  Cancel
                </Button>
              </Group>
            ) : (
              <Button
                color='red'
                leftSection={<IconTrash size={16} />}
                onClick={() => setShowConfirmDelete(true)}
                size='sm'
                variant='light'
              >
                Delete Memory
              </Button>
            )}
          </Stack>
        </div>
      </Stack>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents section (ingested files)
// ─────────────────────────────────────────────────────────────────────────────

function DocumentsSection() {
  const { data: sources = [], isLoading } = useIngestionSources()

  if (isLoading) {
    return <PageLoader size='sm' />
  }

  if (sources.length === 0) {
    return (
      <SectionCard title='Ingested Documents'>
        <EmptyState>No documents ingested yet. Documents are automatically indexed during RAG operations.</EmptyState>
      </SectionCard>
    )
  }

  return (
    <SectionCard title='Ingested Documents'>
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>File Path</Table.Th>
            <Table.Th>Chunks</Table.Th>
            <Table.Th>Last Ingested</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sources.map((source) => (
            <Table.Tr key={source.source_path}>
              <Table.Td>
                <Text
                  ff='monospace'
                  size='sm'
                >
                  {source.source_path}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge
                  color='spore'
                  size='sm'
                  variant='light'
                >
                  {source.chunk_count}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size='sm'>{source.last_ingested ? timeAgo(source.last_ingested) : '—'}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </SectionCard>
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
  const [isGlobalSearch, setIsGlobalSearch] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<'active' | 'all' | 'invalidated' | 'stale'>('all')

  const { data: topics = [], isLoading: topicsLoading } = useTopics()

  const recallQuery = useRecall(debouncedQuery, selectedTopic ?? undefined, 30)
  const globalSearchQuery = useSearchGlobal(debouncedQuery, 30)
  const topicQuery = useTopicMemories(selectedTopic ?? '', 50)

  const hasQuery = !!debouncedQuery.trim()
  const activeQuery = hasQuery ? (isGlobalSearch ? globalSearchQuery : recallQuery) : selectedTopic ? topicQuery : null

  const rawMemories: Memory[] = activeQuery?.data ?? []
  const loading = activeQuery?.isLoading ?? false
  const error = activeQuery?.error
  const memories = reviewFilter === 'all' ? rawMemories : rawMemories.filter((memory) => getMemoryReviewState(memory).kind === reviewFilter)
  const reviewCounts = rawMemories.reduce(
    (counts, memory) => {
      counts[getMemoryReviewState(memory).kind] += 1
      return counts
    },
    { active: 0, invalidated: 0, stale: 0 }
  )

  const showBrowseView = !hasQuery && !selectedTopic && !loading

  function handleTopicClick(topic: string) {
    setSelectedTopic(topic)
    setQuery('')
  }

  function handleClearFilters() {
    setSelectedTopic(null)
    setQuery('')
    setReviewFilter('all')
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
      <Stack gap='xs'>
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

        {hasQuery && (
          <Group gap='xs'>
            <Switch
              checked={isGlobalSearch}
              label={isGlobalSearch ? 'All Projects' : 'This Project'}
              onChange={(e) => setIsGlobalSearch(e.currentTarget.checked)}
              size='sm'
            />
            {isGlobalSearch && (
              <Text
                c='dimmed'
                size='xs'
              >
                Searching across all projects
              </Text>
            )}
          </Group>
        )}

        {!showBrowseView && (
          <Group gap='xs'>
            <Select
              data={[
                { label: 'All review states', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Stale', value: 'stale' },
                { label: 'Invalidated', value: 'invalidated' },
              ]}
              onChange={(value) => setReviewFilter((value as 'active' | 'all' | 'invalidated' | 'stale') ?? 'all')}
              size='xs'
              value={reviewFilter}
              w={190}
            />
            <Badge
              color='gray'
              size='sm'
              variant={reviewFilter === 'all' ? 'light' : 'outline'}
            >
              {reviewCounts.active} active
            </Badge>
            <Badge
              color='yellow'
              size='sm'
              variant={reviewFilter === 'stale' ? 'light' : 'outline'}
            >
              {reviewCounts.stale} stale
            </Badge>
            <Badge
              color='red'
              size='sm'
              variant={reviewFilter === 'invalidated' ? 'light' : 'outline'}
            >
              {reviewCounts.invalidated} invalidated
            </Badge>
          </Group>
        )}
      </Stack>

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

          {!topicsLoading && topics.length > 0 && <DocumentsSection />}
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
          {reviewFilter !== 'all' && (
            <Badge
              color='gray'
              size='sm'
              variant='outline'
            >
              {reviewFilter}
            </Badge>
          )}
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
      {!loading && !showBrowseView && rawMemories.length > 0 && memories.length === 0 && !error && (
        <EmptyState mt='md'>No memories match the current review filter.</EmptyState>
      )}

      {!loading && !showBrowseView && rawMemories.length === 0 && !error && <EmptyState mt='md'>No results found.</EmptyState>}

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
