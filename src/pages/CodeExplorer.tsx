import { ActionIcon, Box, Group, SimpleGrid, Stack, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconLayoutSidebar } from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { useFileTreeState } from '../hooks/useFileTreeState'
import { useDefinition, useExports, useFileSummary, useProject, useRhizomeStatus, useSymbols } from '../lib/queries'
import { memoirsHref, memoriesHref, symbolSearchHref } from '../lib/routes'
import { useProjectContextView } from '../store/project-context'
import { CodeExplorerHeader } from './code-explorer/CodeExplorerHeader'
import { CodeExplorerSidebar } from './code-explorer/CodeExplorerSidebar'
import { CodeExplorerSymbolBrowser } from './code-explorer/CodeExplorerSymbolBrowser'
import { parseCodeExplorerUrlState, toDisplaySymbols, writeCodeExplorerUrlState } from './code-explorer/code-explorer-url-state'
import { FileDetailTabs } from './code-explorer/FileDetailTabs'

const CODE_EXTENSIONS = new Set([
  'c',
  'cc',
  'cpp',
  'cs',
  'dart',
  'ex',
  'go',
  'h',
  'hpp',
  'java',
  'js',
  'jsx',
  'kt',
  'lua',
  'mts',
  'php',
  'py',
  'rb',
  'rs',
  'swift',
  'ts',
  'tsx',
  'zig',
])

function isCodeFile(path: string | null): boolean {
  if (!path) return false
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return CODE_EXTENSIONS.has(ext)
}

export function CodeExplorer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlState = useMemo(() => parseCodeExplorerUrlState(searchParams), [searchParams])

  const [treeOpen, { toggle: toggleTree }] = useDisclosure(false)
  const [showFullDef, setShowFullDef] = useState(false)

  const { data: statusData } = useRhizomeStatus()
  const { data: project } = useProject()
  const { activeProject, recentProjects } = useProjectContextView(project)
  const unavailable = statusData ? !statusData.available : false
  const projectName = activeProject?.split('/').pop() ?? 'project'
  const codeMemoirName = `code:${projectName}`
  const selectedFile = urlState.file || null
  const expandedSymbol = urlState.symbol || null
  const symbolFilter = urlState.filter
  const symbolMode = urlState.mode
  const isExportsMode = symbolMode === 'exports'
  const codeFile = selectedFile && isCodeFile(selectedFile) ? selectedFile : ''
  const tree = useFileTreeState(selectedFile, expandedSymbol, unavailable)
  const treeView = { ...tree, selectedFile }
  const symbolContext = `${selectedFile ?? ''}:${expandedSymbol ?? ''}:${symbolMode}`
  const previousSymbolContext = useRef(symbolContext)

  const updateUrlState = useCallback(
    (updater: (state: ReturnType<typeof parseCodeExplorerUrlState>) => ReturnType<typeof parseCodeExplorerUrlState>) => {
      setSearchParams((current) => writeCodeExplorerUrlState(current, updater(parseCodeExplorerUrlState(current))))
    },
    [setSearchParams]
  )

  const { data: symbols = [], isLoading: symbolsLoading } = useSymbols(codeFile, !isExportsMode)
  const { data: definition, isLoading: defLoading } = useDefinition(codeFile, expandedSymbol ?? '')
  const { data: exports = [], isLoading: exportsLoading } = useExports(codeFile, isExportsMode)
  const { data: fileSummary, isLoading: summaryLoading } = useFileSummary(codeFile)

  const handleLoadSymbols = useCallback(
    (filePath: string) => {
      tree.loadSymbols(filePath)
      setShowFullDef(false)
      updateUrlState((state) => ({
        ...state,
        file: filePath,
        symbol: '',
      }))
    },
    [tree, updateUrlState]
  )

  const handleSymbolClick = useCallback(
    (symbolName: string) => {
      setShowFullDef(false)
      updateUrlState((state) => ({
        ...state,
        symbol: state.symbol === symbolName ? '' : symbolName,
      }))
    },
    [updateUrlState]
  )

  const displaySymbols = useMemo(() => {
    return toDisplaySymbols(symbols, exports, selectedFile ?? '', symbolMode)
  }, [exports, selectedFile, symbolMode, symbols])

  const filteredSymbols = useMemo(() => {
    if (!symbolFilter.trim()) return displaySymbols
    const q = symbolFilter.toLowerCase()
    return displaySymbols.filter((s) => s.name.toLowerCase().includes(q))
  }, [displaySymbols, symbolFilter])

  useEffect(() => {
    if (previousSymbolContext.current === symbolContext) return
    previousSymbolContext.current = symbolContext
    setShowFullDef(false)
  }, [symbolContext])

  const { defPreview, hasMoreLines } = useMemo(() => {
    if (!definition?.body) return { defPreview: '', hasMoreLines: false }
    const lines = definition.body.split('\n')
    return {
      defPreview: lines.slice(0, 20).join('\n'),
      hasMoreLines: lines.length > 20,
    }
  }, [definition])

  if (unavailable) {
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

  if (tree.treeLoading) {
    return <PageLoader />
  }

  return (
    <Stack>
      <CodeExplorerHeader
        activeProject={activeProject}
        projectName={projectName}
        recentProjects={recentProjects}
      />

      <ErrorAlert
        error={tree.error}
        onClose={() => tree.setError(null)}
        withCloseButton
      />

      <Group
        align='start'
        justify='space-between'
      >
        <ActionIcon
          hiddenFrom='sm'
          onClick={toggleTree}
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
        <Box display={{ base: treeOpen ? 'block' : 'none', sm: 'block' }}>
          <CodeExplorerSidebar
            fileTree={treeView}
            onSelect={handleLoadSymbols}
          />
        </Box>

        <Stack style={{ flex: 1 }}>
          {selectedFile ? (
            <>
              <CodeExplorerSymbolBrowser
                definition={definition}
                defLoading={defLoading}
                defPreview={defPreview}
                displaySymbols={displaySymbols}
                expandedSymbol={expandedSymbol}
                exports={exports}
                exportsLoading={exportsLoading}
                fileSummary={summaryLoading ? undefined : fileSummary}
                filteredSymbols={filteredSymbols}
                hasMoreLines={hasMoreLines}
                isCodeFile={isCodeFile(selectedFile)}
                onSymbolClick={handleSymbolClick}
                onSymbolFilterChange={(value) => {
                  setShowFullDef(false)
                  updateUrlState((state) => ({
                    ...state,
                    filter: value,
                    symbol: '',
                  }))
                }}
                onSymbolModeChange={(mode) => {
                  setShowFullDef(false)
                  updateUrlState((state) => ({
                    ...state,
                    mode,
                    symbol: '',
                  }))
                }}
                onToggleFullDef={() => setShowFullDef((value) => !value)}
                searchMemoirsHref={expandedSymbol ? memoirsHref({ concept: expandedSymbol, memoir: codeMemoirName }) : memoirsHref()}
                searchMemoriesHref={expandedSymbol ? memoriesHref({ q: expandedSymbol }) : memoriesHref()}
                searchSymbolsHref={expandedSymbol ? symbolSearchHref(expandedSymbol) : symbolSearchHref()}
                selectedFile={selectedFile}
                showFullDef={showFullDef}
                symbolFilter={symbolFilter}
                symbolMode={symbolMode}
                symbolsLoading={symbolsLoading}
              />

              <FileDetailTabs selectedFile={selectedFile} />
            </>
          ) : (
            <EmptyState>Select a file to explore its symbols</EmptyState>
          )}
        </Stack>
      </SimpleGrid>
    </Stack>
  )
}
