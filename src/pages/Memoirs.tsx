import { Alert, Badge, Card, Group, Loader, Stack, Table, Text, TextInput, Title, UnstyledButton } from '@mantine/core'
import { useCallback, useEffect, useState } from 'react'

import type { Concept, ConceptInspection, Memoir, MemoirDetail } from '../lib/api'

import { hyphaeApi } from '../lib/api'

function parseLabels(raw: string): Array<{ namespace: string; value: string }> {
  try {
    return JSON.parse(raw) as Array<{ namespace: string; value: string }>
  } catch {
    return []
  }
}

function relationColor(relation: string): string {
  switch (relation) {
    case 'DependsOn': return 'orange'
    case 'PartOf': return 'blue'
    case 'Contradicts': return 'red'
    case 'Refines': return 'green'
    case 'CausedBy': return 'yellow'
    case 'SupersededBy': return 'pink'
    default: return 'gray'
  }
}

export function Memoirs() {
  const [memoirs, setMemoirs] = useState<Memoir[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<MemoirDetail | null>(null)
  const [inspectConcept, setInspectConcept] = useState('')
  const [inspection, setInspection] = useState<ConceptInspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [inspectLoading, setInspectLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    hyphaeApi
      .memoirs()
      .then(setMemoirs)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load memoirs'))
      .finally(() => setLoading(false))
  }, [])

  const loadDetail = useCallback(async (name: string) => {
    setSelected(name)
    setDetail(null)
    setInspection(null)
    setInspectConcept('')
    setDetailLoading(true)
    try {
      const data = await hyphaeApi.memoir(name)
      setDetail(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load memoir')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const inspect = useCallback(
    async (conceptName?: string) => {
      const name = conceptName ?? inspectConcept
      if (!selected || !name.trim()) return
      setInspectLoading(true)
      setInspectConcept(name)
      try {
        const data = await hyphaeApi.memoirInspect(selected, name, 2)
        setInspection(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Inspect failed')
      } finally {
        setInspectLoading(false)
      }
    },
    [selected, inspectConcept]
  )

  if (loading) {
    return (
      <Group justify='center' mt='xl'>
        <Loader />
      </Group>
    )
  }

  return (
    <Stack>
      <Title order={2}>Memoirs</Title>

      {error && (
        <Alert color='red' onClose={() => setError(null)} title='Error' withCloseButton>
          {error}
        </Alert>
      )}

      <Group align='start'>
        <Card miw={250} padding='lg' shadow='sm' withBorder>
          <Title mb='sm' order={5}>Knowledge Graphs</Title>
          {memoirs.length > 0 ? (
            <Stack gap='xs'>
              {memoirs.map((m) => (
                <UnstyledButton
                  key={m.id}
                  onClick={() => loadDetail(m.name)}
                  style={(theme) => ({
                    borderRadius: theme.radius.sm,
                    fontWeight: selected === m.name ? 700 : 400,
                    padding: '4px 8px',
                  })}
                >
                  <Text size='sm'>{m.name}</Text>
                  <Text c='dimmed' size='xs'>{m.description}</Text>
                </UnstyledButton>
              ))}
            </Stack>
          ) : (
            <Text c='dimmed' size='sm'>No memoirs found</Text>
          )}
        </Card>

        <Stack style={{ flex: 1 }}>
          {detailLoading && <Loader size='sm' />}

          {detail && (
            <Card padding='lg' shadow='sm' withBorder>
              <Group justify='space-between' mb='sm'>
                <Title order={4}>{detail.memoir.name}</Title>
                <Badge size='sm' variant='light'>{detail.concepts.length} concepts</Badge>
              </Group>
              <Text c='dimmed' mb='md' size='sm'>{detail.memoir.description}</Text>

              {detail.concepts.length > 0 ? (
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
                    {detail.concepts.map((c: Concept) => (
                      <Table.Tr
                        key={c.id}
                        onClick={() => inspect(c.name)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Table.Td>
                          <Text fw={500} size='sm'>{c.name}</Text>
                        </Table.Td>
                        <Table.Td maw={300}>
                          <Text lineClamp={2} size='sm'>{c.definition}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size='sm'>{(c.confidence * 100).toFixed(0)}%</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {parseLabels(c.labels).map((l) => (
                              <Badge key={`${l.namespace}:${l.value}`} size='xs' variant='outline'>
                                {l.namespace}:{l.value}
                              </Badge>
                            ))}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
                <Text c='dimmed' size='sm'>No concepts yet</Text>
              )}
            </Card>
          )}

          {selected && (
            <Card padding='lg' shadow='sm' withBorder>
              <Title mb='sm' order={5}>Inspect Concept</Title>
              <TextInput
                mb='sm'
                onChange={(e) => setInspectConcept(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && inspect()}
                placeholder='Concept name (or click a row above)...'
                value={inspectConcept}
              />
              {inspectLoading && <Loader size='sm' />}
              {inspection && (
                <Stack gap='sm'>
                  <Card bg='dark.6' padding='sm' withBorder>
                    <Text fw={600} size='sm'>{inspection.concept.name}</Text>
                    <Text size='sm'>{inspection.concept.definition}</Text>
                    <Text c='dimmed' size='xs'>
                      Confidence: {(inspection.concept.confidence * 100).toFixed(0)}% | Revision: {inspection.concept.revision}
                    </Text>
                  </Card>

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
                            onClick={() => inspect(n.concept.name)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Table.Td>
                              <Badge color={n.direction === 'outgoing' ? 'blue' : 'green'} size='xs'>
                                {n.direction === 'outgoing' ? '\u2192' : '\u2190'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge color={relationColor(n.link.relation)} size='xs'>{n.link.relation}</Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text fw={500} size='sm'>{n.concept.name}</Text>
                            </Table.Td>
                            <Table.Td maw={300}>
                              <Text lineClamp={1} size='sm'>{n.concept.definition}</Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  ) : (
                    <Text c='dimmed' size='sm'>No connections found</Text>
                  )}
                </Stack>
              )}
            </Card>
          )}
        </Stack>
      </Group>
    </Stack>
  )
}
