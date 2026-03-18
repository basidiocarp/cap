import { ActionIcon, Badge, Box, Group, Loader, ScrollArea, SegmentedControl, Stack, Text, TextInput, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconLayoutSidebar } from '@tabler/icons-react'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { useFileTreeState } from '../hooks/useFileTreeState'
import {
  useAnnotations,
  useCallSites,
  useComplexity,
  useDefinition,
  useExports,
  useFileSummary,
  useRhizomeStatus,
  useSymbols,
} from '../lib/queries'
import { FileDetailTabs } from './code-explorer/FileDetailTabs'
import { FileTreeNode } from './code-explorer/FileTreeNode'
import { SymbolTable } from './code-explorer/SymbolTable'

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
  const unavailable = statusData ? !statusData.available : false

  const onFileSelected = useCallback((_file: string | null, symbol: string | null) => {
    setSymbolFilter('')
    setExpandedSymbol(symbol)
    setShowFullDef(false)
  }, [])

  const tree = useFileTreeState(fileParam, symbolParam, unavailable, onFileSelected)

  const { data: symbols = [], isLoading: symbolsLoading } = useSymbols(tree.selectedFile ?? '')
  const { data: definition, isLoading: defLoading } = useDefinition(tree.selectedFile ?? '', expandedSymbol ?? '')
  const { data: annotations = [], isLoading: annotationsLoading } = useAnnotations(tree.selectedFile ?? '')
  const { data: callSites = [], isLoading: callSitesLoading } = useCallSites(tree.selectedFile ?? '')
  const { data: complexity = [], isLoading: complexityLoading } = useComplexity(tree.selectedFile ?? '')
  const { data: exports = [], isLoading: exportsLoading } = useExports(tree.selectedFile ?? '')
  const { data: fileSummary, isLoading: summaryLoading } = useFileSummary(tree.selectedFile ?? '')

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
    if (symbolMode === 'exports') {
      return exports.map((e) => ({
        doc_comment: null,
        kind: e.kind,
        location: { column_end: 0, column_start: 0, file_path: tree.selectedFile ?? '', line_end: e.line, line_start: e.line },
        name: e.name,
        signature: e.signature,
      }))
    }
    return symbols
  }, [exports, tree.selectedFile, symbolMode, symbols])

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
      <Title order={2}>Code Explorer</Title>

      <ErrorAlert
        error={tree.error}
        onClose={() => tree.setError(null)}
        withCloseButton
      />

      <Group align='start'>
        <ActionIcon
          hiddenFrom='sm'
          onClick={toggleTree}
          title='Toggle file tree'
          variant='subtle'
        >
          <IconLayoutSidebar size={20} />
        </ActionIcon>

        <Box display={{ base: treeOpen ? 'block' : 'none', sm: 'block' }}>
          <SectionCard miw={280}>
            <Title
              mb='sm'
              order={5}
            >
              Files
            </Title>
            <ScrollArea h={600}>
              {tree.rootNodes.length > 0 ? (
                <Stack gap={0}>
                  {tree.rootNodes.map((node) => (
                    <FileTreeNode
                      expanded={tree.expanded}
                      fileTree={tree.fileTree}
                      key={node.path}
                      level={0}
                      node={node}
                      onExpand={tree.handleExpand}
                      onSelect={handleLoadSymbols}
                      selectedFile={tree.selectedFile}
                    />
                  ))}
                </Stack>
              ) : (
                <EmptyState>No files found</EmptyState>
              )}
            </ScrollArea>
          </SectionCard>
        </Box>

        <Stack style={{ flex: 1 }}>
          {tree.selectedFile ? (
            <>
              <Text
                c='dimmed'
                ff='monospace'
                size='sm'
              >
                {tree.selectedFile}
              </Text>

              {!summaryLoading && fileSummary && (
                <Stack gap={4}>
                  <Text
                    c='dimmed'
                    size='sm'
                  >
                    {fileSummary.language} · {fileSummary.lines} lines · {fileSummary.functions} functions · {fileSummary.types} types ·{' '}
                    {fileSummary.exports} exports · {fileSummary.imports} imports
                  </Text>
                  {fileSummary.description && (
                    <Text
                      c='dimmed'
                      size='sm'
                    >
                      {fileSummary.description}
                    </Text>
                  )}
                </Stack>
              )}

              <Group gap='sm'>
                <SegmentedControl
                  data={[
                    { label: 'All', value: 'all' },
                    {
                      label: (
                        <Group gap={4}>
                          <span>Exports only</span>
                          {!exportsLoading && exports.length > 0 && (
                            <Badge
                              color='mycelium'
                              size='xs'
                              variant='light'
                            >
                              {exports.length}
                            </Badge>
                          )}
                        </Group>
                      ),
                      value: 'exports',
                    },
                  ]}
                  onChange={(v) => setSymbolMode(v as 'all' | 'exports')}
                  size='xs'
                  value={symbolMode}
                />
              </Group>

              <TextInput
                onChange={(e) => setSymbolFilter(e.currentTarget.value)}
                placeholder='Filter symbols...'
                value={symbolFilter}
              />

              {(symbolsLoading || (symbolMode === 'exports' && exportsLoading)) && <Loader size='sm' />}

              {!(symbolsLoading || (symbolMode === 'exports' && exportsLoading)) && filteredSymbols.length > 0 && (
                <SymbolTable
                  definition={definition}
                  defLoading={defLoading}
                  defPreview={defPreview}
                  expandedSymbol={expandedSymbol}
                  filteredSymbols={filteredSymbols}
                  hasMoreLines={hasMoreLines}
                  onSymbolClick={handleSymbolClick}
                  onToggleFullDef={() => setShowFullDef((v) => !v)}
                  showFullDef={showFullDef}
                />
              )}

              {!(symbolsLoading || (symbolMode === 'exports' && exportsLoading)) &&
                filteredSymbols.length === 0 &&
                displaySymbols.length > 0 && <EmptyState>No symbols match "{symbolFilter}"</EmptyState>}

              {!(symbolsLoading || (symbolMode === 'exports' && exportsLoading)) && displaySymbols.length === 0 && (
                <EmptyState>
                  {symbolMode === 'exports' ? 'No exported symbols found in this file' : 'No symbols found in this file'}
                </EmptyState>
              )}

              <FileDetailTabs
                annotations={annotations}
                annotationsLoading={annotationsLoading}
                callSites={callSites}
                callSitesLoading={callSitesLoading}
                complexity={complexity}
                complexityLoading={complexityLoading}
                selectedFile={tree.selectedFile}
              />
            </>
          ) : (
            <EmptyState>Select a file to explore its symbols</EmptyState>
          )}
        </Stack>
      </Group>
    </Stack>
  )
}
