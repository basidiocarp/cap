import { Badge, Group, Stack, Title } from '@mantine/core'

import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { MemoryBrowseView } from './MemoryBrowseView'
import { MemoryDetailModal } from './MemoryDetailModal'
import { MemoryResultsPanel } from './MemoryResultsPanel'
import { MemorySearchControls } from './MemorySearchControls'
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
        <MemorySearchControls
          hasQuery={hasQuery}
          isGlobalSearch={isGlobalSearch}
          onClearFilters={handleClearFilters}
          query={query}
          reviewCounts={reviewCounts}
          reviewFilter={reviewFilter}
          selectedTopic={selectedTopic}
          setIsGlobalSearch={setIsGlobalSearch}
          setQuery={setQuery}
          setReviewFilter={setReviewFilter}
          updateSearchState={updateSearchState}
        />
      </Stack>

      <ErrorAlert
        error={error}
        title='Memory search failed'
      />

      {showBrowseView && !loading ? (
        <MemoryBrowseView
          onTopicClick={handleTopicClick}
          topics={topics}
          topicsLoading={topicsLoading}
        />
      ) : null}

      {loading ? (
        <PageLoader
          mt='md'
          size='sm'
        />
      ) : null}

      {!showBrowseView && !error ? (
        <MemoryResultsPanel
          hasQuery={hasQuery}
          loading={loading}
          memories={memories}
          onClearFilters={handleClearFilters}
          onResetReviewFilter={() => {
            setReviewFilter('all')
            updateSearchState({ q: query, review: 'all', topic: selectedTopic })
          }}
          onSelectMemory={setSelectedMemory}
          rawMemories={rawMemories}
          reviewFilter={reviewFilter}
          selectedTopic={selectedTopic}
        />
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
