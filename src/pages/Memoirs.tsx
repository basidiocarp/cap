import { Badge, Group, Loader, ScrollArea, Stack, Table, Text, TextInput, Title, UnstyledButton } from '@mantine/core'
import { useMemo, useState } from 'react'

import type { Concept } from '../lib/api'
import { ConceptGraph } from '../components/ConceptGraph'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { relationColor } from '../lib/colors'
import { onActivate } from '../lib/keyboard'
import { parseJsonArray } from '../lib/parse'
import { useMemoir, useMemoirInspect, useMemoirs } from '../lib/queries'

export function Memoirs() {
  const [selected, setSelected] = useState<string | null>(null)
  const [inspectConcept, setInspectConcept] = useState('')
  const [conceptFilter, setConceptFilter] = useState('')

  const { data: memoirs = [], error: memoirsError, isLoading: memoirsLoading } = useMemoirs()
  const { data: detail, isLoading: detailLoading } = useMemoir(selected ?? '')
  const { data: inspection, isLoading: inspectLoading } = useMemoirInspect(selected ?? '', inspectConcept, 2)

  const filteredConcepts = useMemo(() => {
    if (!detail?.concepts || !conceptFilter.trim()) {
      return detail?.concepts ?? []
    }

    const filterLower = conceptFilter.toLowerCase()
    return detail.concepts.filter((c: Concept) => c.name.toLowerCase().includes(filterLower))
  }, [detail?.concepts, conceptFilter])

  const error = memoirsError

  function handleSelectMemoir(name: string) {
    setSelected(name)
    setInspectConcept('')
    setConceptFilter('')
  }

  function handleInspect(conceptName?: string) {
    const name = conceptName ?? inspectConcept
    if (selected && name.trim()) {
      setInspectConcept(name)
    }
  }

  if (memoirsLoading) {
    return <PageLoader />
  }

  return (
    <Stack>
      <Title order={2}>Memoirs</Title>

      <ErrorAlert
        error={error}
        withCloseButton
      />

      <Group align='start'>
        <SectionCard
          miw={250}
          title='Knowledge Graphs'
          titleOrder={5}
        >
          {memoirs.length > 0 ? (
            <Stack gap='xs'>
              {memoirs.map((m) => (
                <UnstyledButton
                  key={m.id}
                  onClick={() => handleSelectMemoir(m.name)}
                  style={(theme) => ({
                    borderRadius: theme.radius.sm,
                    fontWeight: selected === m.name ? 700 : 400,
                    padding: '4px 8px',
                  })}
                >
                  <Text size='sm'>{m.name}</Text>
                  <Text
                    c='dimmed'
                    size='xs'
                  >
                    {m.description}
                  </Text>
                </UnstyledButton>
              ))}
            </Stack>
          ) : (
            <EmptyState>No memoirs found</EmptyState>
          )}
        </SectionCard>

        <Stack style={{ flex: 1 }}>
          {detailLoading && <Loader size='sm' />}

          {detail && (
            <SectionCard>
              <Group
                justify='space-between'
                mb='sm'
              >
                <Title order={4}>{detail.memoir.name}</Title>
                <Badge
                  size='sm'
                  variant='light'
                >
                  {filteredConcepts.length}/{detail.concepts.length} concepts
                </Badge>
              </Group>
              <Text
                c='dimmed'
                mb='md'
                size='sm'
              >
                {detail.memoir.description}
              </Text>

              {detail.concepts.length > 0 && (
                <TextInput
                  mb='sm'
                  onChange={(e) => setConceptFilter(e.currentTarget.value)}
                  placeholder='Filter concepts by name...'
                  value={conceptFilter}
                />
              )}

              {filteredConcepts.length > 0 ? (
                <ScrollArea>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Concept</Table.Th>
                        <Table.Th>Definition</Table.Th>
                        <Table.Th>Confidence</Table.Th>
                        <Table.Th>Labels</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredConcepts.map((c: Concept) => (
                        <Table.Tr
                          key={c.id}
                          onClick={() => handleInspect(c.name)}
                          onKeyDown={onActivate(() => handleInspect(c.name))}
                          style={{ cursor: 'pointer' }}
                          tabIndex={0}
                        >
                          <Table.Td>
                            <Text
                              fw={500}
                              size='sm'
                            >
                              {c.name}
                            </Text>
                          </Table.Td>
                          <Table.Td maw={300}>
                            <Text
                              lineClamp={2}
                              size='sm'
                            >
                              {c.definition}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size='sm'>{(c.confidence * 100).toFixed(0)}%</Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              {parseJsonArray<{ namespace: string; value: string }>(c.labels).map((l) => (
                                <Badge
                                  color='spore'
                                  key={`${l.namespace}:${l.value}`}
                                  size='xs'
                                  variant='light'
                                >
                                  {l.namespace}:{l.value}
                                </Badge>
                              ))}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              ) : (
                <EmptyState>{conceptFilter ? 'No concepts match the filter' : 'No concepts yet'}</EmptyState>
              )}
            </SectionCard>
          )}

          {selected && inspectConcept && (
            <SectionCard
              title='Knowledge Graph'
              titleOrder={5}
            >
              <ConceptGraph
                concept={inspectConcept}
                depth={2}
                memoir={selected}
                onNodeClick={(name) => setInspectConcept(name)}
              />
            </SectionCard>
          )}

          {selected && (
            <SectionCard
              title='Inspect Concept'
              titleOrder={5}
            >
              <TextInput
                mb='sm'
                onChange={(e) => setInspectConcept(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInspect()}
                placeholder='Concept name (or click a row above)...'
                value={inspectConcept}
              />
              {inspectLoading && <Loader size='sm' />}
              {inspection && (
                <Stack gap='sm'>
                  <SectionCard
                    bg='chitin.9'
                    padding='sm'
                  >
                    <Text
                      c='white'
                      fw={600}
                      size='sm'
                    >
                      {inspection.concept.name}
                    </Text>
                    <Text
                      c='gray.3'
                      size='sm'
                    >
                      {inspection.concept.definition}
                    </Text>
                    <Text
                      c='gray.4'
                      size='xs'
                    >
                      Confidence: {(inspection.concept.confidence * 100).toFixed(0)}% | Revision: {inspection.concept.revision}
                    </Text>
                  </SectionCard>

                  {inspection.neighbors.length > 0 ? (
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Direction</Table.Th>
                          <Table.Th>Relation</Table.Th>
                          <Table.Th>Concept</Table.Th>
                          <Table.Th>Definition</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {inspection.neighbors.map((n) => (
                          <Table.Tr
                            key={n.link.id}
                            onClick={() => handleInspect(n.concept.name)}
                            onKeyDown={onActivate(() => handleInspect(n.concept.name))}
                            style={{ cursor: 'pointer' }}
                            tabIndex={0}
                          >
                            <Table.Td>
                              <Badge
                                color={n.direction === 'outgoing' ? 'spore' : 'lichen'}
                                size='xs'
                                variant='light'
                              >
                                {n.direction === 'outgoing' ? '\u2192' : '\u2190'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={relationColor(n.link.relation)}
                                size='xs'
                                variant='light'
                              >
                                {n.link.relation}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text
                                fw={500}
                                size='sm'
                              >
                                {n.concept.name}
                              </Text>
                            </Table.Td>
                            <Table.Td maw={300}>
                              <Text
                                lineClamp={1}
                                size='sm'
                              >
                                {n.concept.definition}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  ) : (
                    <EmptyState>No connections found</EmptyState>
                  )}
                </Stack>
              )}
            </SectionCard>
          )}
        </Stack>
      </Group>
    </Stack>
  )
}
