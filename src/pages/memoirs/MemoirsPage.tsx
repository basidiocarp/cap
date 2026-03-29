import { Badge, Button, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { memoriesHref, symbolSearchHref } from '../../lib/routes'
import { MemoirConceptsPanel } from './MemoirConceptsPanel'
import { MemoirInspectPanel } from './MemoirInspectPanel'
import { MemoirListSidebar } from './MemoirListSidebar'
import { useMemoirsPageState } from './useMemoirsPageState'

export function MemoirsPage() {
  const state = useMemoirsPageState()

  if (state.memoirsLoading) {
    return <PageLoader />
  }

  return (
    <Stack>
      <Title order={2}>Memoirs</Title>

      <ErrorAlert
        error={state.memoirsError}
        withCloseButton
      />

      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <MemoirListSidebar
            memoirs={state.memoirs}
            onSelect={state.handleSelectMemoir}
            selected={state.selected}
          />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 9 }}>
          {state.detailLoading && <Loader size='sm' />}

          {!state.detail && !state.detailLoading && <EmptyState>Select a memoir to explore its knowledge graph</EmptyState>}

          {state.detail && (
            <Stack>
              <Group justify='space-between'>
                <Group>
                  <Title order={4}>{state.detail.memoir.name}</Title>
                  <Badge
                    size='sm'
                    variant='light'
                  >
                    {state.detail.concepts.length} concepts
                  </Badge>
                </Group>
                <Group gap='xs'>
                  <Button
                    component={Link}
                    size='xs'
                    to={state.inspectConcept ? memoriesHref({ q: state.inspectConcept }) : memoriesHref()}
                    variant='subtle'
                  >
                    Search related memories
                  </Button>
                  {state.detail.memoir.name.startsWith('code:') && state.inspectConcept && (
                    <Button
                      component={Link}
                      size='xs'
                      to={symbolSearchHref(state.inspectConcept)}
                      variant='light'
                    >
                      Search code symbols
                    </Button>
                  )}
                </Group>
              </Group>

              <Text
                c='dimmed'
                size='sm'
              >
                {state.detail.memoir.description}
              </Text>

              <MemoirInspectPanel
                graphDepth={state.graphDepth}
                history={state.history}
                inspectConcept={state.inspectConcept}
                inspection={state.inspection}
                inspectLoading={state.inspectLoading}
                onBack={state.handleBack}
                onChangeDepth={(value) => {
                  state.setGraphDepth(value)
                  state.commitUrlState({
                    concept: state.inspectConcept,
                    depth: value,
                    filter: state.conceptFilter,
                    memoir: state.selected ?? '',
                    page: state.conceptPage,
                  })
                }}
                onInspect={state.handleInspect}
                panelRef={state.inspectRef}
                searchMemoriesHref={state.inspectConcept ? memoriesHref({ q: state.inspectConcept }) : memoriesHref()}
                searchSymbolsHref={
                  state.detail.memoir.name.startsWith('code:') && state.inspectConcept ? symbolSearchHref(state.inspectConcept) : null
                }
              />

              <MemoirConceptsPanel
                conceptFilter={state.conceptFilter}
                conceptPage={state.conceptPage}
                currentRangeEnd={state.currentRangeEnd}
                currentRangeStart={state.currentRangeStart}
                detail={state.detail}
                inspectConcept={state.inspectConcept}
                onChangeFilter={(value) => {
                  state.setConceptFilter(value)
                  state.setConceptPage(1)
                  state.commitUrlState({
                    concept: state.inspectConcept,
                    depth: state.graphDepth,
                    filter: value,
                    memoir: state.selected ?? '',
                    page: 1,
                  })
                }}
                onChangePage={(page) => {
                  state.setConceptPage(page)
                  state.commitUrlState({
                    concept: state.inspectConcept,
                    depth: state.graphDepth,
                    filter: state.conceptFilter,
                    memoir: state.selected ?? '',
                    page,
                  })
                }}
                onInspect={state.handleInspect}
                pageSize={state.pageSize}
                totalPages={state.totalPages}
              />
            </Stack>
          )}
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
