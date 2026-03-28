import { useDebouncedValue } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { Memory } from '../../lib/api'
import type { ReviewFilter } from './memory-utils'
import { getMemoryReviewState } from '../../lib/memory-review'
import { useRecall, useSearchGlobal, useTopicMemories, useTopics } from '../../lib/queries'

export function useMemoriesSearchState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(() => searchParams.get('topic'))
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [debouncedQuery] = useDebouncedValue(query, 400)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [isGlobalSearch, setIsGlobalSearch] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>(() => (searchParams.get('review') as ReviewFilter) ?? 'all')

  const topicsQuery = useTopics()
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

  useEffect(() => {
    setSelectedTopic(searchParams.get('topic'))
    setQuery(searchParams.get('q') ?? '')
    setReviewFilter((searchParams.get('review') as ReviewFilter) ?? 'all')
  }, [searchParams])

  function updateSearchState(next: { q?: string; review?: ReviewFilter; topic?: string | null }) {
    setSearchParams((current) => {
      const params = new URLSearchParams(current)

      if (next.q?.trim()) params.set('q', next.q)
      else params.delete('q')

      if (next.topic) params.set('topic', next.topic)
      else params.delete('topic')

      if (next.review && next.review !== 'all') params.set('review', next.review)
      else params.delete('review')

      return params
    })
  }

  function handleTopicClick(topic: string) {
    setSelectedTopic(topic)
    setQuery('')
    updateSearchState({ q: '', review: reviewFilter, topic })
  }

  function handleClearFilters() {
    setSelectedTopic(null)
    setQuery('')
    setReviewFilter('all')
    updateSearchState({ q: '', review: 'all', topic: null })
  }

  return {
    error,
    handleClearFilters,
    handleTopicClick,
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
    setIsGlobalSearch,
    setQuery,
    setReviewFilter,
    setSelectedMemory,
    showBrowseView,
    topics: topicsQuery.data ?? [],
    topicsLoading: topicsQuery.isLoading,
    updateSearchState,
  }
}
