import { ActionIcon, Box, Group, SimpleGrid, Stack, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconLayoutSidebar } from '@tabler/icons-react'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { useFileTreeState } from '../hooks/useFileTreeState'
import { useDefinition, useExports, useFileSummary, useProject, useRhizomeStatus, useSymbols } from '../lib/queries'
import { useProjectContextView } from '../store/project-context'
import { CodeExplorerHeader } from './code-explorer/CodeExplorerHeader'
import { CodeExplorerSidebar } from './code-explorer/CodeExplorerSidebar'
import { CodeExplorerSymbolBrowser } from './code-explorer/CodeExplorerSymbolBrowser'
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
  const [searchParams] = useSearchParams()
  const fileParam = searchParams.get('file')
  const symbolParam = searchParams.get('symbol')

  const [treeOpen, { toggle: toggleTree }] = useDisclosure(false)
  const [symbolFilter, setSymbolFilter] = useState('')
  const [symbolMode, setSymbolMode] = useState<'all' | 'exports'>('all')
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [showFullDef, setShowFullDef] = useState(false)

  const { data: statusData } = useRhizomeStatus()
  const { data: project } = useProject()
  const { activeProject, recentProjects } = useProjectContextView(project)
  const unavailable = statusData ? !statusData.available : false
  const projectName = activeProject?.split('/').pop() ?? 'project'

  const onFileSelected = useCallback((_file: string | null, symbol: string | null) => {
    setSymbolFilter('')
    setExpandedSymbol(symbol)
    setShowFullDef(false)
  }, [])

  const tree = useFileTreeState(fileParam, symbolParam, unavailable, onFileSelected)

  const codeFile = isCodeFile(tree.selectedFile) ? (tree.selectedFile ?? '') : ''
  const isExportsMode = symbolMode === 'exports'

  const { data: symbols = [], isLoading: symbolsLoading } = useSymbols(codeFile, !isExportsMode)
  const { data: definition, isLoading: defLoading } = useDefinition(codeFile, expandedSymbol ?? '')
  const { data: exports = [], isLoading: exportsLoading } = useExports(codeFile, isExportsMode)
  const { data: fileSummary, isLoading: summaryLoading } = useFileSummary(codeFile)

  const handleLoadSymbols = useCallback(
    (filePath: string) => {
      tree.loadSymbols(filePath)
      setExpandedSymbol(null)
      setShowFullDef(false)
      setSymbolFilter('')
    },
    [tree]
  )

  const handleSymbolClick = useCallback(
    (symbolName: string) => {
      if (expandedSymbol === symbolName) {
        setExpandedSymbol(null)
        setShowFullDef(false)
      } else {
        setExpandedSymbol(symbolName)
        setShowFullDef(false)
      }
    },
    [expandedSymbol]
  )

  const displaySymbols = useMemo(() => {
    if (isExportsMode) {
      return exports.map((e) => ({
        doc_comment: null,
        kind: e.kind,
        location: { column_end: 0, column_start: 0, file_path: tree.selectedFile ?? '', line_end: e.line, line_start: e.line },
        name: e.name,
        signature: e.signature,
      }))
    }
    return symbols
  }, [exports, isExportsMode, tree.selectedFile, symbols])

  const filteredSymbols = useMemo(() => {
    if (!symbolFilter.trim()) return displaySymbols
    const q = symbolFilter.toLowerCase()
    return displaySymbols.filter((s) => s.name.toLowerCase().includes(q))
  }, [displaySymbols, symbolFilter])

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
            fileTree={tree}
            onSelect={handleLoadSymbols}
          />
        </Box>

        <Stack style={{ flex: 1 }}>
          {tree.selectedFile ? (
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
                isCodeFile={isCodeFile(tree.selectedFile)}
                onSymbolClick={handleSymbolClick}
                onSymbolFilterChange={setSymbolFilter}
                onSymbolModeChange={setSymbolMode}
                onToggleFullDef={() => setShowFullDef((value) => !value)}
                selectedFile={tree.selectedFile}
                showFullDef={showFullDef}
                symbolFilter={symbolFilter}
                symbolMode={symbolMode}
                symbolsLoading={symbolsLoading}
              />

              <FileDetailTabs selectedFile={tree.selectedFile} />
            </>
          ) : (
            <EmptyState>Select a file to explore its symbols</EmptyState>
          )}
        </Stack>
      </SimpleGrid>
    </Stack>
  )
}
