import { Alert, Badge, Button, Code, Grid, Group, Modal, Progress, Select, Stack, Text, Textarea } from '@mantine/core'
import { IconAlertCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { Memory } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { importanceColor } from '../../lib/colors'
import { getMemoryReviewState } from '../../lib/memory-review'
import { useDeleteMemory, useInvalidateMemory, useMemory, useUpdateImportance } from '../../lib/queries'
import { codeExplorerHref, memoirsHref, memoriesHref, symbolSearchHref } from '../../lib/routes'
import { timeAgo } from '../../lib/time'
import { getKeywords, getMemoryFollowUpQuery, getRelatedIds, reviewColor, reviewLabel, topicColor, weightColor } from './memory-utils'

export function MemoryDetailModal({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showInvalidateForm, setShowInvalidateForm] = useState(false)
  const [invalidateReason, setInvalidateReason] = useState('')
  const deleteMemory = useDeleteMemory()
  const invalidateMemory = useInvalidateMemory()
  const { data: freshMemory } = useMemory(memory.id)
  const updateImportance = useUpdateImportance()
  const detail = freshMemory ?? memory
  const review = getMemoryReviewState(detail)
  const followUpQuery = getMemoryFollowUpQuery(detail)
  const relatedMemoriesHref = followUpQuery ? memoriesHref({ q: followUpQuery, review: 'all' }) : memoriesHref({ topic: detail.topic })
  const relatedMemoirsHref = followUpQuery ? memoirsHref({ filter: followUpQuery }) : memoirsHref()
  const relatedCodeHref = followUpQuery ? symbolSearchHref(followUpQuery) : codeExplorerHref()

  const handleDelete = async () => {
    await deleteMemory.mutateAsync(detail.id)
    setShowConfirmDelete(false)
    onClose()
  }

  const handleImportanceChange = async (importance: string | null) => {
    if (importance) {
      await updateImportance.mutateAsync({ id: detail.id, importance })
    }
  }

  const handleInvalidate = async () => {
    await invalidateMemory.mutateAsync({
      id: detail.id,
      reason: invalidateReason.trim() || undefined,
    })
    setShowInvalidateForm(false)
    setInvalidateReason('')
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
            {detail.invalidated_at ? (
              <Text size='xs'>
                Invalidated {timeAgo(detail.invalidated_at)} on {new Date(detail.invalidated_at).toLocaleString()}
              </Text>
            ) : null}
            {detail.invalidated_by ? <Text size='xs'>Invalidated by {detail.invalidated_by}</Text> : null}
            {detail.superseded_by_memory_id ? (
              <Text size='xs'>Superseded by memory {detail.superseded_by_memory_id.slice(0, 8)}</Text>
            ) : null}
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

        {detail.raw_excerpt ? (
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
        ) : null}

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

        {getKeywords(detail.keywords).length > 0 ? (
          <div>
            <Text
              c='dimmed'
              mb={4}
              size='xs'
            >
              Keywords
            </Text>
            <Group gap={4}>
              {getKeywords(detail.keywords).map((keyword) => (
                <Badge
                  key={keyword}
                  size='sm'
                  variant='outline'
                >
                  {keyword}
                </Badge>
              ))}
            </Group>
          </div>
        ) : null}

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

        {detail.source_type ? (
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
        ) : null}

        {getRelatedIds(detail.related_ids).length > 0 ? (
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
        ) : null}

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
                    placeholder='Explain why this memory should stay visible for audit but stop being reused.'
                    value={invalidateReason}
                  />
                  <Group gap='xs'>
                    <Button
                      color='red'
                      disabled={invalidateMemory.isPending}
                      onClick={handleInvalidate}
                      size='sm'
                    >
                      {invalidateMemory.isPending ? 'Invalidating...' : 'Invalidate memory'}
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
                <Stack gap={6}>
                  <Text
                    c='dimmed'
                    size='xs'
                  >
                    Invalidated memories stay visible for audit and investigation, but Hyphae should stop reusing them during normal recall.
                  </Text>
                  <Button
                    color='yellow'
                    onClick={() => setShowInvalidateForm(true)}
                    size='sm'
                    variant='light'
                  >
                    Invalidate for recall
                  </Button>
                </Stack>
              )}

              <Stack gap={6}>
                <Text
                  c='dimmed'
                  size='xs'
                >
                  {detail.invalidated_at
                    ? 'Next step: inspect the concept or code surface that should replace this memory.'
                    : 'Use related concept and code views when you need to validate or replace this memory.'}
                </Text>
                <Group gap='xs'>
                  <Button
                    component={Link}
                    size='xs'
                    to={relatedMemoriesHref}
                    variant='light'
                  >
                    Search related memories
                  </Button>
                  <Button
                    component={Link}
                    size='xs'
                    to={relatedMemoirsHref}
                    variant='subtle'
                  >
                    Inspect related concepts
                  </Button>
                  <Button
                    component={Link}
                    size='xs'
                    to={relatedCodeHref}
                    variant='subtle'
                  >
                    Search code symbols
                  </Button>
                </Group>
              </Stack>
            </Stack>

            {deleteMemory.isError ? (
              <Alert
                color='red'
                icon={<IconAlertCircle size={16} />}
                title='Error'
              >
                {deleteMemory.error instanceof Error ? deleteMemory.error.message : 'Failed to delete memory'}
              </Alert>
            ) : null}

            {updateImportance.isError ? (
              <Alert
                color='red'
                icon={<IconAlertCircle size={16} />}
                title='Error'
              >
                {updateImportance.error instanceof Error ? updateImportance.error.message : 'Failed to update importance'}
              </Alert>
            ) : null}

            {invalidateMemory.isError ? (
              <Alert
                color='red'
                icon={<IconAlertCircle size={16} />}
                title='Error'
              >
                {invalidateMemory.error instanceof Error ? invalidateMemory.error.message : 'Failed to invalidate memory'}
              </Alert>
            ) : null}

            {showConfirmDelete ? (
              <Group gap='xs'>
                <Button
                  color='red'
                  disabled={deleteMemory.isPending}
                  onClick={() => void handleDelete()}
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
