import { Badge, Group, Select, Stack, Switch, Text, TextInput, UnstyledButton } from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'

import { getReviewFilterHint } from './memory-utils'

type ReviewFilter = 'active' | 'all' | 'invalidated' | 'stale'

export function MemorySearchControls({
  hasQuery,
  isGlobalSearch,
  query,
  reviewCounts,
  reviewFilter,
  selectedTopic,
  setIsGlobalSearch,
  setQuery,
  setReviewFilter,
  updateSearchState,
  onClearFilters,
}: {
  hasQuery: boolean
  isGlobalSearch: boolean
  query: string
  reviewCounts: Record<Exclude<ReviewFilter, 'all'>, number>
  reviewFilter: ReviewFilter
  selectedTopic: string | null
  setIsGlobalSearch: (value: boolean) => void
  setQuery: (value: string) => void
  setReviewFilter: (value: ReviewFilter) => void
  updateSearchState: (state: { q: string; review: ReviewFilter; topic: string | null }) => void
  onClearFilters: () => void
}) {
  return (
    <Stack gap='xs'>
      <Group>
        <TextInput
          leftSection={<IconSearch size={16} />}
          onChange={(event) => {
            const nextValue = event.currentTarget.value
            setQuery(nextValue)
            updateSearchState({ q: nextValue, review: reviewFilter, topic: selectedTopic })
          }}
          placeholder='Search memories...'
          rightSection={
            query ? (
              <IconX
                onClick={() => {
                  setQuery('')
                  updateSearchState({ q: '', review: reviewFilter, topic: selectedTopic })
                }}
                size={14}
                style={{ cursor: 'pointer' }}
              />
            ) : null
          }
          style={{ flex: 1 }}
          value={query}
        />
        {selectedTopic || hasQuery ? (
          <UnstyledButton onClick={onClearFilters}>
            <Text
              c='dimmed'
              size='sm'
              td='underline'
            >
              Clear all
            </Text>
          </UnstyledButton>
        ) : null}
      </Group>

      {hasQuery ? (
        <Group gap='xs'>
          <Switch
            checked={isGlobalSearch}
            label={isGlobalSearch ? 'All Projects' : 'This Project'}
            onChange={(event) => setIsGlobalSearch(event.currentTarget.checked)}
            size='sm'
          />
          {isGlobalSearch ? (
            <Text
              c='dimmed'
              size='xs'
            >
              Searching across all projects
            </Text>
          ) : null}
        </Group>
      ) : null}

      <Stack gap={6}>
        <Group gap='xs'>
          <Select
            data={[
              { label: 'All review states', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Stale', value: 'stale' },
              { label: 'Invalidated', value: 'invalidated' },
            ]}
            onChange={(value) => {
              const nextValue = (value as ReviewFilter) ?? 'all'
              setReviewFilter(nextValue)
              updateSearchState({ q: query, review: nextValue, topic: selectedTopic })
            }}
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
        <Text
          c='dimmed'
          size='xs'
        >
          {getReviewFilterHint(reviewFilter)}
        </Text>
      </Stack>
    </Stack>
  )
}
