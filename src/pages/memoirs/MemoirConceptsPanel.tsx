import { Badge, Group, Pagination, ScrollArea, Stack, Table, Text, TextInput } from '@mantine/core'

import type { Concept, MemoirDetail } from '../../lib/api'
import { EmptyState } from '../../components/EmptyState'
import { SectionCard } from '../../components/SectionCard'
import { onActivate } from '../../lib/keyboard'
import { parseJsonArray } from '../../lib/parse'

interface MemoirConceptsPanelProps {
  conceptFilter: string
  conceptPage: number
  currentRangeEnd: number
  currentRangeStart: number
  detail: MemoirDetail
  inspectConcept: string
  onChangeFilter: (value: string) => void
  onChangePage: (page: number) => void
  onInspect: (conceptName: string) => void
  pageSize: number
  totalPages: number
}

export function MemoirConceptsPanel({
  conceptFilter,
  conceptPage,
  currentRangeEnd,
  currentRangeStart,
  detail,
  inspectConcept,
  onChangeFilter,
  onChangePage,
  onInspect,
  pageSize,
  totalPages,
}: MemoirConceptsPanelProps) {
  return (
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
          {currentRangeStart}-{currentRangeEnd} of {detail.total_concepts}
        </Badge>
      </Group>

      <Stack gap='xs'>
        <TextInput
          aria-label='Filter concepts by name or definition'
          onChange={(event) => onChangeFilter(event.currentTarget.value)}
          placeholder='Filter concepts by name or definition...'
          size='xs'
          value={conceptFilter}
        />
        <Group justify='space-between'>
          <Text
            c='dimmed'
            size='xs'
          >
            Large memoirs are loaded in pages of {pageSize} concepts to keep the UI responsive.
          </Text>
          {detail.total_concepts > pageSize && (
            <Pagination
              onChange={onChangePage}
              size='sm'
              total={totalPages}
              value={conceptPage}
            />
          )}
        </Group>
      </Stack>

      {detail.concepts.length > 0 ? (
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
              {detail.concepts.map((concept: Concept) => (
                <Table.Tr
                  aria-current={inspectConcept === concept.name ? 'true' : undefined}
                  aria-label={`Inspect concept ${concept.name}`}
                  key={concept.id}
                  onClick={() => onInspect(concept.name)}
                  onKeyDown={onActivate(() => onInspect(concept.name))}
                  style={{
                    background: inspectConcept === concept.name ? 'var(--mantine-color-mycelium-light)' : undefined,
                    cursor: 'pointer',
                    outlineOffset: 2,
                  }}
                  tabIndex={0}
                >
                  <Table.Td>
                    <Text
                      fw={500}
                      size='sm'
                    >
                      {concept.name}
                    </Text>
                  </Table.Td>
                  <Table.Td maw={250}>
                    <Text
                      lineClamp={2}
                      size='sm'
                    >
                      {concept.definition}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size='sm'>{(concept.confidence * 100).toFixed(0)}%</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {parseJsonArray<{ namespace: string; value: string }>(concept.labels).map((label) => (
                        <Badge
                          color='spore'
                          key={`${label.namespace}:${label.value}`}
                          size='xs'
                          variant='light'
                        >
                          {label.value}
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
        <EmptyState>{conceptFilter ? 'No concepts match the filter' : 'No concepts in this memoir yet'}</EmptyState>
      )}
    </SectionCard>
  )
}
