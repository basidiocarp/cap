import { Group, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconSearch, IconX } from '@tabler/icons-react'

import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { ProjectContextSummary } from '../../components/ProjectContextSummary'
import { SymbolSearchExamples } from './SymbolSearchExamples'
import { SymbolSearchResults } from './SymbolSearchResults'
import { useSymbolSearchPageState } from './useSymbolSearchPageState'

export function SymbolSearchPage() {
  const state = useSymbolSearchPageState()

  if (state.status && !state.status.available) {
    return (
      <Stack>
        <Title order={2}>Symbol Search</Title>
        <ErrorAlert
          error='Rhizome code intelligence is not available. Make sure it is running.'
          title='Rhizome Unavailable'
        />
      </Stack>
    )
  }

  return (
    <Stack>
      <Group justify='space-between'>
        <Title order={2}>Symbol Search</Title>
      </Group>

      {state.activeProject ? (
        <ProjectContextSummary
          activeProject={state.activeProject}
          note={`Search functions, classes, types, and modules across ${state.projectName}.`}
          recentProjects={state.recentProjects}
        />
      ) : (
        <Text
          c='dimmed'
          size='sm'
        >
          Search functions, classes, types, and modules across {state.projectName}
        </Text>
      )}

      <TextInput
        leftSection={<IconSearch size={16} />}
        onChange={(e) => {
          const nextValue = e.currentTarget.value
          state.setQuery(nextValue)
          state.setUrlQuery(nextValue)
        }}
        placeholder='Search symbols — try a function name, class, or type...'
        rightSection={
          state.query ? (
            <IconX
              onClick={state.clearQuery}
              size={14}
              style={{ cursor: 'pointer' }}
            />
          ) : null
        }
        size='md'
        value={state.query}
      />

      <ErrorAlert error={state.error} />

      {!state.debouncedQuery.trim() && !state.loading && (
        <Stack>
          <Text
            c='dimmed'
            size='sm'
          >
            Try searching for:
          </Text>
          <SymbolSearchExamples onExampleClick={state.handleExampleClick} />
        </Stack>
      )}

      {state.loading && (
        <PageLoader
          mt='md'
          size='sm'
        />
      )}

      {!state.loading && state.debouncedQuery.trim() && state.results.length > 0 && (
        <SymbolSearchResults
          query={state.debouncedQuery}
          results={state.results}
        />
      )}

      {!state.loading && state.debouncedQuery.trim() && state.results.length === 0 && !state.error && (
        <EmptyState mt='md'>
          No symbols found matching &lsquo;{state.debouncedQuery}&rsquo; in {state.projectName}
        </EmptyState>
      )}
    </Stack>
  )
}
