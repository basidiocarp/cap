import { Badge, Button, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { useMemoir, useMemoirInspect, useMemoirs } from '../lib/queries'
import { memoriesHref, symbolSearchHref } from '../lib/routes'
import { MemoirConceptsPanel } from './memoirs/MemoirConceptsPanel'
import { MemoirInspectPanel } from './memoirs/MemoirInspectPanel'
import { MemoirListSidebar } from './memoirs/MemoirListSidebar'
import { DEFAULT_MEMOIR_PAGE, readMemoirUrlState, writeMemoirUrlState } from './memoirs/memoir-url-state'

const CONCEPTS_PAGE_SIZE = 200

export function Memoirs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialUrlState = readMemoirUrlState(searchParams)
  const [selected, setSelected] = useState<string | null>(() => initialUrlState.memoir || null)
  const [inspectConcept, setInspectConcept] = useState(initialUrlState.concept)
  const [conceptFilter, setConceptFilter] = useState(initialUrlState.filter)
  const [conceptPage, setConceptPage] = useState(initialUrlState.page)
  const [graphDepth, setGraphDepth] = useState(initialUrlState.depth)
  const [history, setHistory] = useState<string[]>([])
  const inspectRef = useRef<HTMLDivElement>(null)
  const deferredConceptFilter = useDeferredValue(conceptFilter.trim())

  useEffect(() => {
    const nextUrlState = readMemoirUrlState(searchParams)

    setHistory([])
    setSelected(nextUrlState.memoir || null)
    setInspectConcept(nextUrlState.concept)
    setConceptFilter(nextUrlState.filter)
    setConceptPage(nextUrlState.page)
    setGraphDepth(nextUrlState.depth)
  }, [searchParams])

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

  function commitUrlState(nextState: { concept: string; depth: string; filter: string; memoir: string; page: number }) {
    setSearchParams(writeMemoirUrlState(searchParams, nextState))
  }

  function handleSelectMemoir(name: string) {
    setSelected(name)
    setInspectConcept('')
    setConceptFilter('')
    setConceptPage(1)
    setHistory([])
    commitUrlState({
      concept: '',
      depth: graphDepth,
      filter: '',
      memoir: name,
      page: DEFAULT_MEMOIR_PAGE,
    })
  }

  function handleInspect(conceptName: string) {
    if (!conceptName.trim() || !selected) return
    if (inspectConcept && inspectConcept !== conceptName) {
      setHistory((prev) => [...prev.slice(-9), inspectConcept])
    }
    setInspectConcept(conceptName)
    commitUrlState({
      concept: conceptName,
      depth: graphDepth,
      filter: conceptFilter,
      memoir: selected,
      page: conceptPage,
    })
  }

  function handleBack() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setInspectConcept(prev)
    commitUrlState({
      concept: prev,
      depth: graphDepth,
      filter: conceptFilter,
      memoir: selected ?? '',
      page: conceptPage,
    })
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
                <Group gap='xs'>
                  <Button
                    component={Link}
                    size='xs'
                    to={inspectConcept ? memoriesHref({ q: inspectConcept }) : memoriesHref()}
                    variant='subtle'
                  >
                    Search memories
                  </Button>
                  {detail.memoir.name.startsWith('code:') && inspectConcept && (
                    <Button
                      component={Link}
                      size='xs'
                      to={symbolSearchHref(inspectConcept)}
                      variant='light'
                    >
                      Find in code
                    </Button>
                  )}
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
                onChangeDepth={(value) => {
                  setGraphDepth(value)
                  commitUrlState({
                    concept: inspectConcept,
                    depth: value,
                    filter: conceptFilter,
                    memoir: selected ?? '',
                    page: conceptPage,
                  })
                }}
                onInspect={handleInspect}
                panelRef={inspectRef}
                searchMemoriesHref={inspectConcept ? memoriesHref({ q: inspectConcept }) : memoriesHref()}
                searchSymbolsHref={detail.memoir.name.startsWith('code:') && inspectConcept ? symbolSearchHref(inspectConcept) : null}
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
                  commitUrlState({
                    concept: inspectConcept,
                    depth: graphDepth,
                    filter: value,
                    memoir: selected ?? '',
                    page: 1,
                  })
                }}
                onChangePage={(page) => {
                  setConceptPage(page)
                  commitUrlState({
                    concept: inspectConcept,
                    depth: graphDepth,
                    filter: conceptFilter,
                    memoir: selected ?? '',
                    page,
                  })
                }}
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
