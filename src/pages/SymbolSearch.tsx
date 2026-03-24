import { Badge, Card, Group, ScrollArea, SimpleGrid, Stack, Table, Text, TextInput, Title, UnstyledButton } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconCode, IconSearch, IconX } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { ProjectContextSummary } from '../components/ProjectContextSummary'
import { SectionCard } from '../components/SectionCard'
import { symbolKindColor } from '../lib/colors'
import { onActivate } from '../lib/keyboard'
import { useProject, useRhizomeStatus, useSymbolSearch } from '../lib/queries'
import { useProjectContextView } from '../store/project-context'

const SEARCH_EXAMPLES = [
  { description: 'Find all functions', pattern: 'fn ' },
  { description: 'Find React components', pattern: 'Component' },
  { description: 'Find error handling', pattern: 'Error' },
  { description: 'Find configuration', pattern: 'Config' },
  { description: 'Find test functions', pattern: 'test_' },
  { description: 'Find main entrypoints', pattern: 'main' },
]

export function SymbolSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 400)

  const { data: status } = useRhizomeStatus()
  const { data: project } = useProject()
  const { activeProject, recentProjects } = useProjectContextView(project)
  const { data: results = [], error, isLoading: loading } = useSymbolSearch(debouncedQuery)

  const projectName = activeProject?.split('/').pop() ?? 'project'

  function handleExampleClick(pattern: string) {
    setQuery(pattern)
  }

  if (status && !status.available) {
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

      {activeProject ? (
        <ProjectContextSummary
          activeProject={activeProject}
          note={`Search functions, classes, types, and modules across ${projectName}.`}
          recentProjects={recentProjects}
        />
      ) : (
        <Text
          c='dimmed'
          size='sm'
        >
          Search functions, classes, types, and modules across {projectName}
        </Text>
      )}

      <TextInput
        leftSection={<IconSearch size={16} />}
        onChange={(e) => setQuery(e.currentTarget.value)}
        placeholder='Search symbols — try a function name, class, or type...'
        rightSection={
          query ? (
            <IconX
              onClick={() => setQuery('')}
              size={14}
              style={{ cursor: 'pointer' }}
            />
          ) : null
        }
        size='md'
        value={query}
      />

      <ErrorAlert error={error} />

      {/* No query — show suggestions */}
      {!debouncedQuery.trim() && !loading && (
        <Stack>
          <Text
            c='dimmed'
            size='sm'
          >
            Try searching for:
          </Text>
          <SimpleGrid cols={{ base: 2, md: 3 }}>
            {SEARCH_EXAMPLES.map((ex) => (
              <UnstyledButton
                aria-label={`Search example: ${ex.pattern}`}
                key={ex.pattern}
                onClick={() => handleExampleClick(ex.pattern)}
                style={{ display: 'block', width: '100%' }}
              >
                <Card
                  padding='sm'
                  radius='md'
                  shadow='xs'
                  style={{ cursor: 'pointer' }}
                  withBorder
                >
                  <Group gap='sm'>
                    <IconCode
                      color='var(--mantine-color-mycelium-6)'
                      size={16}
                    />
                    <div>
                      <Text
                        ff='monospace'
                        fw={500}
                        size='sm'
                      >
                        {ex.pattern}
                      </Text>
                      <Text
                        c='dimmed'
                        size='xs'
                      >
                        {ex.description}
                      </Text>
                    </div>
                  </Group>
                </Card>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </Stack>
      )}

      {loading && (
        <PageLoader
          mt='md'
          size='sm'
        />
      )}

      {!loading && debouncedQuery.trim() && results.length > 0 && (
        <Group justify='space-between'>
          <Text
            c='dimmed'
            size='sm'
          >
            {results.length} symbols matching &lsquo;{debouncedQuery}&rsquo;
          </Text>
          <Group gap={4}>
            {Object.entries(
              results.reduce(
                (acc, r) => {
                  acc[r.kind] = (acc[r.kind] || 0) + 1
                  return acc
                },
                {} as Record<string, number>
              )
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([kind, count]) => (
                <Badge
                  color={symbolKindColor(kind)}
                  key={kind}
                  size='xs'
                  variant='light'
                >
                  {kind}: {count}
                </Badge>
              ))}
          </Group>
        </Group>
      )}

      {!loading && debouncedQuery.trim() && results.length === 0 && !error && (
        <EmptyState mt='md'>
          No symbols found matching &lsquo;{debouncedQuery}&rsquo; in {projectName}
        </EmptyState>
      )}

      {results.length > 0 && (
        <SectionCard>
          <ScrollArea>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Symbol</Table.Th>
                  <Table.Th w={80}>Kind</Table.Th>
                  <Table.Th>File</Table.Th>
                  <Table.Th w={60}>Line</Table.Th>
                  <Table.Th>Signature</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {results.map((r) => (
                  <Table.Tr
                    key={`${r.file}:${r.line}:${r.name}`}
                    onClick={() => navigate(`/code?file=${encodeURIComponent(r.file)}&symbol=${encodeURIComponent(r.name)}`)}
                    onKeyDown={onActivate(() => navigate(`/code?file=${encodeURIComponent(r.file)}&symbol=${encodeURIComponent(r.name)}`))}
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                  >
                    <Table.Td>
                      <Text
                        fw={500}
                        size='sm'
                      >
                        {r.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={symbolKindColor(r.kind)}
                        size='xs'
                        variant='light'
                      >
                        {r.kind}
                      </Badge>
                    </Table.Td>
                    <Table.Td maw={300}>
                      <Text
                        c='dimmed'
                        ff='monospace'
                        lineClamp={1}
                        size='xs'
                      >
                        {r.file}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text
                        c='dimmed'
                        size='sm'
                      >
                        {r.line}
                      </Text>
                    </Table.Td>
                    <Table.Td maw={350}>
                      {r.signature && (
                        <Text
                          c='dimmed'
                          ff='monospace'
                          lineClamp={1}
                          size='xs'
                        >
                          {r.signature}
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </SectionCard>
      )}
    </Stack>
  )
}
