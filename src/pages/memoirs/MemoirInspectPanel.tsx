import type { RefObject } from 'react'
import { Badge, Group, Loader, ScrollArea, SegmentedControl, Stack, Table, Text, Tooltip, UnstyledButton } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { lazy, Suspense } from 'react'

import type { ConceptInspection } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { relationColor } from '../../lib/colors'
import { onActivate } from '../../lib/keyboard'

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

const CONCEPT_GRAPH_HEIGHT = 450

const ConceptGraph = lazy(async () => {
  const { ConceptGraph: Graph } = await import('../../components/ConceptGraph')
  return { default: Graph }
})

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

function GraphLoadingState() {
  return (
    <Stack
      align='center'
      aria-live='polite'
      justify='center'
      mih={CONCEPT_GRAPH_HEIGHT}
      role='status'
    >
      <Loader size='sm' />
      <Text
        c='dimmed'
        size='sm'
      >
        Loading graph
      </Text>
    </Stack>
  )
}

interface MemoirInspectPanelProps {
  graphDepth: string
  history: string[]
  inspectConcept: string
  inspectLoading: boolean
  inspection?: ConceptInspection
  onBack: () => void
  onChangeDepth: (value: string) => void
  onInspect: (conceptName: string) => void
  panelRef: RefObject<HTMLDivElement | null>
}

export function MemoirInspectPanel({
  graphDepth,
  history,
  inspectConcept,
  inspectLoading,
  inspection,
  onBack,
  onChangeDepth,
  onInspect,
  panelRef,
}: MemoirInspectPanelProps) {
  if (!inspectConcept) {
    return null
  }

  return (
    <div ref={panelRef}>
      <SectionCard>
        <Group
          justify='space-between'
          mb='sm'
        >
          <Group gap='xs'>
            {history.length > 0 && (
              <Tooltip label={`Back to ${history[history.length - 1]}`}>
                <UnstyledButton onClick={onBack}>
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
              onChange={onChangeDepth}
              size='xs'
              value={graphDepth}
            />
          </Group>
        </Group>

        <Suspense fallback={<GraphLoadingState />}>
          <ConceptGraph
            inspection={inspection}
            isLoading={inspectLoading}
            onNodeClick={onInspect}
          />
        </Suspense>

        <GraphLegend />

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
                    {inspection.neighbors.map((neighbor) => (
                      <Table.Tr
                        key={neighbor.link.id}
                        onClick={() => onInspect(neighbor.concept.name)}
                        onKeyDown={onActivate(() => onInspect(neighbor.concept.name))}
                        style={{ cursor: 'pointer' }}
                        tabIndex={0}
                      >
                        <Table.Td>
                          <Badge
                            color={neighbor.direction === 'outgoing' ? 'spore' : 'lichen'}
                            size='xs'
                            variant='light'
                          >
                            {neighbor.direction === 'outgoing' ? '\u2192' : '\u2190'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={relationColor(neighbor.link.relation)}
                            size='xs'
                            variant='light'
                          >
                            {neighbor.link.relation}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            fw={500}
                            size='sm'
                          >
                            {neighbor.concept.name}
                          </Text>
                        </Table.Td>
                        <Table.Td maw={250}>
                          <Text
                            lineClamp={1}
                            size='sm'
                          >
                            {neighbor.concept.definition}
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
  )
}
