import {
  Badge,
  Grid,
  Group,
  Loader,
  ScrollArea,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { useMemo, useRef, useState } from 'react'

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

// ─────────────────────────────────────────────────────────────────────────────
// Graph legend
// ─────────────────────────────────────────────────────────────────────────────

const NODE_LEGEND = [
  { color: '#20c997', label: 'Function/Method' },
  { color: '#9775fa', label: 'Class/Struct' },
  { color: '#ff9800', label: 'Interface/Trait' },
  { color: '#334e68', label: 'Module' },
  { color: '#ffca28', label: 'Other' },
]

const EDGE_LEGEND = [
  { color: '#ffa726', label: 'calls' },
  { color: '#627d98', label: 'contains' },
  { color: '#9775fa', label: 'implements' },
  { color: '#00bcd4', label: 'imports' },
]

function GraphLegend() {
  return (
    <Group gap='lg'>
      <Group gap={6}>
        <Text
          c='dimmed'
          size='xs'
        >
          Nodes:
        </Text>
        {NODE_LEGEND.map((item) => (
          <Group
            gap={4}
            key={item.label}
          >
            <div style={{ background: item.color, borderRadius: '50%', height: 8, width: 8 }} />
            <Text size='xs'>{item.label}</Text>
          </Group>
        ))}
      </Group>
      <Group gap={6}>
        <Text
          c='dimmed'
          size='xs'
        >
          Edges:
        </Text>
        {EDGE_LEGEND.map((item) => (
          <Group
            gap={4}
            key={item.label}
          >
            <div style={{ background: item.color, borderRadius: 2, height: 3, width: 12 }} />
            <Text size='xs'>{item.label}</Text>
          </Group>
        ))}
      </Group>
    </Group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function Memoirs() {
  const [selected, setSelected] = useState<string | null>(null)
  const [inspectConcept, setInspectConcept] = useState('')
  const [conceptFilter, setConceptFilter] = useState('')
  const [graphDepth, setGraphDepth] = useState('2')
  const [history, setHistory] = useState<string[]>([])
  const inspectRef = useRef<HTMLDivElement>(null)

  const { data: memoirs = [], error: memoirsError, isLoading: memoirsLoading } = useMemoirs()
  const { data: detail, isLoading: detailLoading } = useMemoir(selected ?? '')
  const { data: inspection, isLoading: inspectLoading } = useMemoirInspect(selected ?? '', inspectConcept, Number(graphDepth))

  const filteredConcepts = useMemo(() => {
    if (!detail?.concepts || !conceptFilter.trim()) {
      return detail?.concepts ?? []
    }
    const filterLower = conceptFilter.toLowerCase()
    return detail.concepts.filter((c: Concept) => c.name.toLowerCase().includes(filterLower))
  }, [detail?.concepts, conceptFilter])

  function handleSelectMemoir(name: string) {
    setSelected(name)
    setInspectConcept('')
    setConceptFilter('')
    setHistory([])
  }

  function handleInspect(conceptName: string) {
    if (!conceptName.trim() || !selected) return
    if (inspectConcept && inspectConcept !== conceptName) {
      setHistory((prev) => [...prev.slice(-9), inspectConcept])
    }
    setInspectConcept(conceptName)
  }

  function handleBack() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setInspectConcept(prev)
  }

  if (memoirsLoading) {
    return <PageLoader />
  }

  return (
    <Stack>
      <Title order={2}>Memoirs</Title>

      <ErrorAlert
        error={memoirsError}
        withCloseButton
      />

      <Grid>
        {/* Memoir list sidebar */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <SectionCard
            title='Knowledge Graphs'
            titleOrder={5}
          >
            <ScrollArea h={600}>
              {memoirs.length > 0 ? (
                <Stack gap='xs'>
                  {memoirs.map((m) => (
                    <UnstyledButton
                      key={m.id}
                      onClick={() => handleSelectMemoir(m.name)}
                      style={(theme) => ({
                        background: selected === m.name ? 'var(--mantine-color-mycelium-light)' : undefined,
                        borderRadius: theme.radius.sm,
                        padding: '6px 10px',
                      })}
                    >
                      <Text
                        fw={selected === m.name ? 700 : 400}
                        size='sm'
                      >
                        {m.name}
                      </Text>
                      <Text
                        c='dimmed'
                        lineClamp={1}
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
            </ScrollArea>
          </SectionCard>
        </Grid.Col>

        {/* Main content area */}
        <Grid.Col span={{ base: 12, md: 9 }}>
          {detailLoading && <Loader size='sm' />}

          {!detail && !detailLoading && <EmptyState>Select a memoir to explore its knowledge graph</EmptyState>}

          {detail && (
            <Stack>
              {/* Header */}
              <Group justify='space-between'>
                <Group>
                  <Title order={4}>{detail.memoir.name}</Title>
                  <Badge
                    size='sm'
                    variant='light'
                  >
                    {detail.concepts.length} concepts
                  </Badge>
                </Group>
              </Group>

              <Text
                c='dimmed'
                size='sm'
              >
                {detail.memoir.description}
              </Text>

              {/* Graph + inspect section (side by side on desktop) */}
              {inspectConcept && (
                <div ref={inspectRef}>
                  <SectionCard>
                    {/* Breadcrumb / navigation */}
                    <Group
                      justify='space-between'
                      mb='sm'
                    >
                      <Group gap='xs'>
                        {history.length > 0 && (
                          <Tooltip label={`Back to ${history[history.length - 1]}`}>
                            <UnstyledButton onClick={handleBack}>
                              <IconArrowLeft size={16} />
                            </UnstyledButton>
                          </Tooltip>
                        )}
                        <Text
                          fw={600}
                          size='sm'
                        >
                          {inspectConcept}
                        </Text>
                        {history.length > 0 && (
                          <Text
                            c='dimmed'
                            size='xs'
                          >
                            ({history.length} back)
                          </Text>
                        )}
                      </Group>
                      <Group gap='xs'>
                        <Text
                          c='dimmed'
                          size='xs'
                        >
                          Depth:
                        </Text>
                        <SegmentedControl
                          data={['1', '2', '3', '4']}
                          onChange={setGraphDepth}
                          size='xs'
                          value={graphDepth}
                        />
                      </Group>
                    </Group>

                    {/* Graph visualization */}
                    <ConceptGraph
                      concept={inspectConcept}
                      depth={Number(graphDepth)}
                      memoir={selected ?? ''}
                      onNodeClick={handleInspect}
                    />

                    <GraphLegend />

                    {/* Concept detail + neighbors */}
                    {inspectLoading && <Loader size='sm' />}
                    {inspection && (
                      <Stack
                        gap='sm'
                        mt='sm'
                      >
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

                        {inspection.neighbors.length > 0 && (
                          <ScrollArea mah={300}>
                            <Table highlightOnHover>
                              <Table.Thead>
                                <Table.Tr>
                                  <Table.Th w={40}>Dir</Table.Th>
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
                                    <Table.Td maw={250}>
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
                          </ScrollArea>
                        )}
                      </Stack>
                    )}
                  </SectionCard>
                </div>
              )}

              {/* Concepts table */}
              <SectionCard>
                <Group
                  justify='space-between'
                  mb='sm'
                >
                  <Text
                    fw={500}
                    size='sm'
                  >
                    Concepts
                  </Text>
                  <Badge
                    size='sm'
                    variant='light'
                  >
                    {filteredConcepts.length}/{detail.concepts.length}
                  </Badge>
                </Group>

                {detail.concepts.length > 0 && (
                  <TextInput
                    mb='sm'
                    onChange={(e) => setConceptFilter(e.currentTarget.value)}
                    placeholder='Filter concepts...'
                    size='xs'
                    value={conceptFilter}
                  />
                )}

                {filteredConcepts.length > 0 ? (
                  <ScrollArea mah={400}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Concept</Table.Th>
                          <Table.Th>Definition</Table.Th>
                          <Table.Th w={70}>Conf.</Table.Th>
                          <Table.Th>Labels</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {filteredConcepts.map((c: Concept) => (
                          <Table.Tr
                            key={c.id}
                            onClick={() => handleInspect(c.name)}
                            onKeyDown={onActivate(() => handleInspect(c.name))}
                            style={{
                              background: inspectConcept === c.name ? 'var(--mantine-color-mycelium-light)' : undefined,
                              cursor: 'pointer',
                            }}
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
                            <Table.Td maw={250}>
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
                                    {l.value}
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
            </Stack>
          )}
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
