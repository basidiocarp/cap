import { ActionIcon, Box, Group, SimpleGrid, Stack, Title } from '@mantine/core'
import { IconLayoutSidebar } from '@tabler/icons-react'

import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { CodeExplorerHeader } from './CodeExplorerHeader'
import { CodeExplorerSidebar } from './CodeExplorerSidebar'
import { CodeExplorerSymbolBrowser } from './CodeExplorerSymbolBrowser'
import { isCodeFile } from './code-file-utils'
import { FileDetailTabs } from './FileDetailTabs'
import { useCodeExplorerState } from './useCodeExplorerState'

export function CodeExplorerPage() {
  const state = useCodeExplorerState()

  if (state.unavailable) {
    return (
      <Stack>
        <Title order={2}>Code Explorer</Title>
        <ErrorAlert
          error='The Rhizome code intelligence service is not available. Make sure it is running and configured correctly to explore code symbols.'
          title='Rhizome Unavailable'
        />
      </Stack>
    )
  }

  if (state.treeLoading) {
    return <PageLoader />
  }

  return (
    <Stack>
      <CodeExplorerHeader
        activeProject={state.activeProject}
        projectName={state.projectName}
        recentProjects={state.recentProjects}
      />

      <ErrorAlert
        error={state.treeView.error}
        onClose={() => state.treeView.setError(null)}
        withCloseButton
      />

      <Group
        align='start'
        justify='space-between'
      >
        <ActionIcon
          hiddenFrom='sm'
          onClick={state.toggleTree}
          title='Toggle file tree'
          variant='subtle'
        >
          <IconLayoutSidebar size={20} />
        </ActionIcon>
      </Group>

      <SimpleGrid
        cols={{ base: 1, lg: 2 }}
        spacing='lg'
        verticalSpacing='lg'
      >
        <Box display={{ base: state.treeOpen ? 'block' : 'none', sm: 'block' }}>
          <CodeExplorerSidebar
            fileTree={state.treeView}
            onSelect={state.handleLoadSymbols}
          />
        </Box>

        <Stack style={{ flex: 1 }}>
          {state.selectedFile ? (
            <>
              <CodeExplorerSymbolBrowser
                definition={state.definition}
                defLoading={state.defLoading}
                defPreview={state.defPreview}
                displaySymbols={state.displaySymbols}
                expandedSymbol={state.expandedSymbol}
                exports={state.exports}
                exportsLoading={state.exportsLoading}
                fileSummary={state.summaryLoading ? undefined : state.fileSummary}
                filteredSymbols={state.filteredSymbols}
                hasMoreLines={state.hasMoreLines}
                isCodeFile={isCodeFile(state.selectedFile)}
                onSymbolClick={state.handleSymbolClick}
                onSymbolFilterChange={(value) => {
                  state.setShowFullDef(false)
                  state.updateUrlState((current) => ({
                    ...current,
                    filter: value,
                    symbol: '',
                  }))
                }}
                onSymbolModeChange={(mode) => {
                  state.setShowFullDef(false)
                  state.updateUrlState((current) => ({
                    ...current,
                    mode,
                    symbol: '',
                  }))
                }}
                onToggleFullDef={() => state.setShowFullDef((value) => !value)}
                searchMemoirsHref={state.explorerLinks.searchMemoirsHref}
                searchMemoriesHref={state.explorerLinks.searchMemoriesHref}
                searchSymbolsHref={state.explorerLinks.searchSymbolsHref}
                selectedFile={state.selectedFile}
                showFullDef={state.showFullDef}
                symbolFilter={state.symbolFilter}
                symbolMode={state.symbolMode}
                symbolsLoading={state.symbolsLoading}
              />

              <FileDetailTabs selectedFile={state.selectedFile} />
            </>
          ) : (
            <EmptyState>Select a file to explore its symbols</EmptyState>
          )}
        </Stack>
      </SimpleGrid>
    </Stack>
  )
}
