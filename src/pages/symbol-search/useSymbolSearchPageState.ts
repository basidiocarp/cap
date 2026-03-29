import { useDebouncedValue } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useProjectContextController, useRhizomeStatus, useSymbolSearch } from '../../lib/queries'
import { useProjectContextView } from '../../store/project-context'

export const SEARCH_EXAMPLES = [
  { description: 'Find all functions', pattern: 'fn ' },
  { description: 'Find React components', pattern: 'Component' },
  { description: 'Find error handling', pattern: 'Error' },
  { description: 'Find configuration', pattern: 'Config' },
  { description: 'Find test functions', pattern: 'test_' },
  { description: 'Find main entrypoints', pattern: 'main' },
]

export function useSymbolSearchPageState() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [debouncedQuery] = useDebouncedValue(query, 400)

  const { data: status } = useRhizomeStatus()
  const { data: project } = useProjectContextController()
  const { activeProject, recentProjects } = useProjectContextView(project)
  const { data: results = [], error, isLoading: loading } = useSymbolSearch(debouncedQuery)

  const projectName = activeProject?.split('/').pop() ?? 'project'

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  function setUrlQuery(nextValue: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextValue.trim()) next.set('q', nextValue)
      else next.delete('q')
      return next
    })
  }

  function handleExampleClick(pattern: string) {
    setQuery(pattern)
    setUrlQuery(pattern)
  }

  function clearQuery() {
    setQuery('')
    setUrlQuery('')
  }

  return {
    activeProject,
    clearQuery,
    debouncedQuery,
    error,
    handleExampleClick,
    loading,
    projectName,
    query,
    recentProjects,
    results,
    setQuery,
    setUrlQuery,
    status,
  }
}
