import {
  Badge,
  Button,
  Card,
  Group,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { ActionEmptyState } from '../../components/ActionEmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { SectionCard } from '../../components/SectionCard'
import { codeExplorerHref, memoirsHref } from '../../lib/routes'
import { timeAgo } from '../../lib/time'
import { DocumentsSection } from './DocumentsSection'
import { MemoryDetailModal } from './MemoryDetailModal'
import { MemoryTable } from './MemoryTable'
import { getReviewFilterHint, topicColor, topicIcon, weightColor } from './memory-utils'
import { useMemoriesSearchState } from './useMemoriesSearchState'

export function MemoriesPage() {
  const {
    error,
    hasQuery,
    isGlobalSearch,
    loading,
    memories,
    query,
    rawMemories,
    reviewCounts,
    reviewFilter,
    selectedMemory,
    selectedTopic,
    showBrowseView,
    topics,
    topicsLoading,
    setIsGlobalSearch,
    setQuery,
    setReviewFilter,
    setSelectedMemory,
    updateSearchState,
    handleClearFilters,
    handleTopicClick,
  } = useMemoriesSearchState()

  return (
    <Stack>
      <Group justify='space-between'>
        <Title order={2}>Memories</Title>
        {memories.length > 0 ? (
          <Badge
            size='lg'
            variant='light'
          >
            {memories.length} results
          </Badge>
        ) : null}
      </Group>

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
            <UnstyledButton onClick={handleClearFilters}>
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

        {showBrowseView ? null : (
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
                  const nextValue = (value as typeof reviewFilter) ?? 'all'
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
        )}
      </Stack>

      <ErrorAlert error={error} />

      {showBrowseView ? (
        <>
          {topicsLoading ? <PageLoader size='sm' /> : null}

          {!topicsLoading && topics.length === 0 ? (
            <ActionEmptyState
              actions={
                <>
                  <Button
                    component={Link}
                    size='xs'
                    to='/status'
                    variant='light'
                  >
                    Check status
                  </Button>
                  <Button
                    component={Link}
                    size='xs'
                    to='/onboard'
                    variant='subtle'
                  >
                    Open onboarding
                  </Button>
                </>
              }
              description='No memories have been stored for this project yet.'
              hint='Memories are created automatically during agent sessions. If you expected memories already, check Status to confirm Hyphae flow is healthy for the host you are using.'
              mt='md'
              title='No memories yet'
            />
          ) : null}

          {!topicsLoading && topics.length > 0 ? (
            <SimpleGrid cols={{ base: 2, lg: 4, md: 3 }}>
              {topics.map((topic) => (
                <UnstyledButton
                  key={topic.topic}
                  onClick={() => handleTopicClick(topic.topic)}
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
                        color={topicColor(topic.topic)}
                        size='lg'
                        variant='light'
                        w={36}
                      >
                        {topicIcon(topic.topic)}
                      </Badge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          fw={500}
                          lineClamp={1}
                          size='sm'
                        >
                          {topic.topic}
                        </Text>
                      </div>
                    </Group>
                    <Group justify='space-between'>
                      <Text
                        c='dimmed'
                        size='xs'
                      >
                        {topic.count} {topic.count === 1 ? 'memory' : 'memories'}
                      </Text>
                      <Tooltip label={`Avg weight: ${topic.avg_weight.toFixed(2)}`}>
                        <Progress
                          color={weightColor(topic.avg_weight)}
                          size='xs'
                          value={topic.avg_weight * 100}
                          w={50}
                        />
                      </Tooltip>
                    </Group>
                    <Text
                      c='dimmed'
                      mt={4}
                      size='xs'
                    >
                      Latest: {timeAgo(topic.newest)}
                    </Text>
                  </Card>
                </UnstyledButton>
              ))}
            </SimpleGrid>
          ) : null}

          {!topicsLoading && topics.length > 0 ? <DocumentsSection /> : null}
        </>
      ) : null}

      {selectedTopic && !hasQuery ? (
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
      ) : null}

      {loading ? (
        <PageLoader
          mt='md'
          size='sm'
        />
      ) : null}

      {!loading && !showBrowseView && rawMemories.length > 0 && memories.length === 0 && !error ? (
        <ActionEmptyState
          actions={
            <>
              <Button
                onClick={() => {
                  setReviewFilter('all')
                  updateSearchState({ q: query, review: 'all', topic: selectedTopic })
                }}
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
      ) : null}

      {!loading && !showBrowseView && rawMemories.length === 0 && !error ? (
        <ActionEmptyState
          actions={
            <>
              <Button
                onClick={handleClearFilters}
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
      ) : null}

      {memories.length > 0 ? (
        <SectionCard>
          <MemoryTable
            memories={memories}
            onSelect={setSelectedMemory}
          />
        </SectionCard>
      ) : null}

      {selectedMemory ? (
        <MemoryDetailModal
          memory={selectedMemory}
          onClose={() => setSelectedMemory(null)}
        />
      ) : null}
    </Stack>
  )
}
