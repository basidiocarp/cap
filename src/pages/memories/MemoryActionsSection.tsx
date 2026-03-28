import type { UseMutationResult } from '@tanstack/react-query'
import { Alert, Badge, Button, Group, Select, Stack, Text, Textarea } from '@mantine/core'
import { IconAlertCircle, IconTrash } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { Memory } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'

export function MemoryActionsSection({
  deleteMemory,
  detail,
  handleDelete,
  handleImportanceChange,
  handleInvalidate,
  invalidateMemory,
  invalidateReason,
  relatedCodeHref,
  relatedMemoriesHref,
  relatedMemoirsHref,
  setInvalidateReason,
  setShowConfirmDelete,
  setShowInvalidateForm,
  showConfirmDelete,
  showInvalidateForm,
  updateImportance,
}: {
  deleteMemory: UseMutationResult<{ result: string }, Error, string, unknown>
  detail: Memory
  handleDelete: () => Promise<void>
  handleImportanceChange: (importance: string | null) => Promise<void>
  handleInvalidate: () => Promise<void>
  invalidateMemory: UseMutationResult<{ result: string }, Error, { id: string; reason?: string }, unknown>
  invalidateReason: string
  relatedCodeHref: string
  relatedMemoriesHref: string
  relatedMemoirsHref: string
  setInvalidateReason: (value: string) => void
  setShowConfirmDelete: (value: boolean) => void
  setShowInvalidateForm: (value: boolean) => void
  showConfirmDelete: boolean
  showInvalidateForm: boolean
  updateImportance: UseMutationResult<{ result: string }, Error, { id: string; importance: string }, unknown>
}) {
  return (
    <div style={{ borderTop: '1px solid var(--mantine-color-dark-6)', paddingTop: 'var(--mantine-spacing-md)' }}>
      <Stack gap='sm'>
        <Select
          clearable
          data={['critical', 'high', 'medium', 'low', 'ephemeral']}
          disabled={updateImportance.isPending}
          label='Importance'
          onChange={(value) => void handleImportanceChange(value)}
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
                  onClick={() => void handleInvalidate()}
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
  )
}
