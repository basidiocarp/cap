import { Badge, Button, Group, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { Memory } from '../../lib/api'
import { ActionEmptyState } from '../../components/ActionEmptyState'
import { SectionCard } from '../../components/SectionCard'
import { codeExplorerHref, memoirsHref } from '../../lib/routes'
import { MemoryTable } from './MemoryTable'
import { topicColor } from './memory-utils'

type ReviewFilter = 'active' | 'all' | 'invalidated' | 'stale'

export function MemoryResultsPanel({
  hasQuery,
  loading,
  memories,
  onClearFilters,
  onResetReviewFilter,
  onSelectMemory,
  rawMemories,
  reviewFilter,
  selectedTopic,
}: {
  hasQuery: boolean
  loading: boolean
  memories: Memory[]
  onClearFilters: () => void
  onResetReviewFilter: () => void
  onSelectMemory: (memory: Memory) => void
  rawMemories: Memory[]
  reviewFilter: ReviewFilter
  selectedTopic: string | null
}) {
  if (selectedTopic && !hasQuery) {
    return (
      <>
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
          {reviewFilter !== 'all' ? (
            <Badge
              color='gray'
              size='sm'
              variant='outline'
            >
              {reviewFilter}
            </Badge>
          ) : null}
        </Group>

        {memories.length > 0 ? (
          <SectionCard>
            <MemoryTable
              memories={memories}
              onSelect={onSelectMemory}
            />
          </SectionCard>
        ) : null}
      </>
    )
  }

  if (!loading && rawMemories.length > 0 && memories.length === 0) {
    return (
      <ActionEmptyState
        actions={
          <>
            <Button
              onClick={onResetReviewFilter}
              size='xs'
              variant='light'
            >
              Show all review states
            </Button>
            <Button
              component={Link}
              size='xs'
              to={memoirsHref()}
              variant='subtle'
            >
              Open memoirs
            </Button>
          </>
        }
        description='No memories match the current review filter in this result set.'
        hint='Try another review state or open Memoirs if you want the longer-lived structured knowledge view instead of episodic memories.'
        mt='md'
        title={`No ${reviewFilter === 'all' ? 'matching' : reviewFilter} memories here`}
      />
    )
  }

  if (!loading && rawMemories.length === 0) {
    return (
      <ActionEmptyState
        actions={
          <>
            <Button
              onClick={onClearFilters}
              size='xs'
              variant='light'
            >
              Clear filters
            </Button>
            <Button
              component={Link}
              size='xs'
              to={codeExplorerHref()}
              variant='subtle'
            >
              Open code explorer
            </Button>
            <Button
              component={Link}
              size='xs'
              to={memoirsHref()}
              variant='subtle'
            >
              Open memoirs
            </Button>
          </>
        }
        description={hasQuery ? 'No memories matched the current search.' : 'There are no memories in this topic yet.'}
        hint={
          hasQuery
            ? 'Try a broader query, switch between this project and all projects, or open Code Explorer and Memoirs if the information you want is still structured as code or concepts.'
            : 'If you expected activity here already, check Status first to confirm memory flow is healthy.'
        }
        mt='md'
        title={hasQuery ? 'No memory results' : 'No memories in this topic'}
      />
    )
  }

  return memories.length > 0 ? (
    <SectionCard>
      <MemoryTable
        memories={memories}
        onSelect={onSelectMemory}
      />
    </SectionCard>
  ) : null
}
