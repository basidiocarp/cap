import { Badge, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useDeferredValue, useEffect, useRef, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { useMemoir, useMemoirInspect, useMemoirs } from '../lib/queries'
import { MemoirConceptsPanel } from './memoirs/MemoirConceptsPanel'
import { MemoirInspectPanel } from './memoirs/MemoirInspectPanel'
import { MemoirListSidebar } from './memoirs/MemoirListSidebar'

const CONCEPTS_PAGE_SIZE = 200

export function Memoirs() {
  const [selected, setSelected] = useState<string | null>(null)
  const [inspectConcept, setInspectConcept] = useState('')
  const [conceptFilter, setConceptFilter] = useState('')
  const [conceptPage, setConceptPage] = useState(1)
  const [graphDepth, setGraphDepth] = useState('2')
  const [history, setHistory] = useState<string[]>([])
  const inspectRef = useRef<HTMLDivElement>(null)
  const deferredConceptFilter = useDeferredValue(conceptFilter.trim())

  const { data: memoirs = [], error: memoirsError, isLoading: memoirsLoading } = useMemoirs()
  const { data: detail, isLoading: detailLoading } = useMemoir(selected ?? '', {
    limit: CONCEPTS_PAGE_SIZE,
    offset: (conceptPage - 1) * CONCEPTS_PAGE_SIZE,
    q: deferredConceptFilter || undefined,
  })
  const { data: inspection, isLoading: inspectLoading } = useMemoirInspect(selected ?? '', inspectConcept, Number(graphDepth))
  const totalPages = detail ? Math.max(1, Math.ceil(detail.total_concepts / CONCEPTS_PAGE_SIZE)) : 1
  const currentRangeStart = detail && detail.total_concepts > 0 ? detail.offset + 1 : 0
  const currentRangeEnd = detail ? Math.min(detail.offset + detail.concepts.length, detail.total_concepts) : 0

  useEffect(() => {
    if (!inspectConcept) return
    inspectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [inspectConcept])

  function handleSelectMemoir(name: string) {
    setSelected(name)
    setInspectConcept('')
    setConceptFilter('')
    setConceptPage(1)
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
        <Grid.Col span={{ base: 12, md: 3 }}>
          <MemoirListSidebar
            memoirs={memoirs}
            onSelect={handleSelectMemoir}
            selected={selected}
          />
        </Grid.Col>

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

              <MemoirInspectPanel
                graphDepth={graphDepth}
                history={history}
                inspectConcept={inspectConcept}
                inspection={inspection}
                inspectLoading={inspectLoading}
                onBack={handleBack}
                onChangeDepth={setGraphDepth}
                onInspect={handleInspect}
                panelRef={inspectRef}
              />

              <MemoirConceptsPanel
                conceptFilter={conceptFilter}
                conceptPage={conceptPage}
                currentRangeEnd={currentRangeEnd}
                currentRangeStart={currentRangeStart}
                detail={detail}
                inspectConcept={inspectConcept}
                onChangeFilter={(value) => {
                  setConceptFilter(value)
                  setConceptPage(1)
                }}
                onChangePage={setConceptPage}
                onInspect={handleInspect}
                pageSize={CONCEPTS_PAGE_SIZE}
                totalPages={totalPages}
              />
            </Stack>
          )}
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
