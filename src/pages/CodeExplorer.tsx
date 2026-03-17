import { ActionIcon, Badge, Box, Group, Loader, ScrollArea, SegmentedControl, Stack, Text, TextInput, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconLayoutSidebar } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { FileNode } from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { rhizomeApi } from '../lib/api'
import {
  rhizomeKeys,
  useAnnotations,
  useCallSites,
  useComplexity,
  useDefinition,
  useExports,
  useFileSummary,
  useFileTree,
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
  const queryClient = useQueryClient()

  const [treeOpen, { toggle: toggleTree }] = useDisclosure(false)
  const [fileTree, setFileTree] = useState<Map<string, FileNode[]>>(new Map())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [symbolFilter, setSymbolFilter] = useState('')
  const [symbolMode, setSymbolMode] = useState<'all' | 'exports'>('all')
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [showFullDef, setShowFullDef] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedDirs, setLoadedDirs] = useState<Set<string>>(new Set())

  const { data: statusData } = useRhizomeStatus()
  const unavailable = statusData ? !statusData.available : false
  const { data: initialTree, isLoading: treeLoading } = useFileTree(undefined, 2)
  const { data: symbols = [], isLoading: symbolsLoading } = useSymbols(selectedFile ?? '')
  const { data: definition, isLoading: defLoading } = useDefinition(selectedFile ?? '', expandedSymbol ?? '')
  const { data: annotations = [], isLoading: annotationsLoading } = useAnnotations(selectedFile ?? '')
  const { data: callSites = [], isLoading: callSitesLoading } = useCallSites(selectedFile ?? '')
  const { data: complexity = [], isLoading: complexityLoading } = useComplexity(selectedFile ?? '')
  const { data: exports = [], isLoading: exportsLoading } = useExports(selectedFile ?? '')
  const { data: fileSummary, isLoading: summaryLoading } = useFileSummary(selectedFile ?? '')

  useEffect(() => {
    // index initial tree into a path → children map
    if (!initialTree) return
    const tree = new Map<string, FileNode[]>()
    tree.set('', initialTree)
    const indexChildren = (items: FileNode[]) => {
      for (const node of items) {
        if (node.type === 'dir' && node.children) {
          tree.set(node.path, node.children)
          indexChildren(node.children)
        }
      }
    }
    indexChildren(initialTree)
    setFileTree(tree)
    setLoadedDirs(new Set(tree.keys()))
  }, [initialTree])

  useEffect(() => {
    // expand tree to file/symbol from URL params
    if (!fileParam || treeLoading || unavailable) return
    const parts = fileParam.split('/')
    const dirs: string[] = []
    for (let i = 0; i < parts.length - 1; i++) {
      dirs.push(parts.slice(0, i + 1).join('/'))
    }
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const d of dirs) next.add(d)
      return next
    })
    setSelectedFile(fileParam)
    setSymbolFilter('')
    setExpandedSymbol(symbolParam ?? null)
    setShowFullDef(false)
  }, [fileParam, symbolParam, treeLoading, unavailable])

  const handleExpand = useCallback(
    async (dirPath: string) => {
      setExpanded((prev) => {
        const next = new Set(prev)
        if (next.has(dirPath)) {
          next.delete(dirPath)
        } else {
          next.add(dirPath)
        }
        return next
      })
      if (!loadedDirs.has(dirPath)) {
        try {
          const children = await queryClient.fetchQuery({
            queryFn: () => rhizomeApi.files(dirPath, 1),
            queryKey: rhizomeKeys.files(dirPath, 1),
          })
          setFileTree((prev) => {
            const next = new Map(prev)
            next.set(dirPath, children)
            return next
          })
          setLoadedDirs((prev) => {
            const next = new Set(prev)
            next.add(dirPath)
            return next
          })
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to load directory')
        }
      }
    },
    [loadedDirs, queryClient]
  )

  const loadSymbols = useCallback((filePath: string) => {
    setSelectedFile(filePath)
    setExpandedSymbol(null)
    setShowFullDef(false)
    setSymbolFilter('')
  }, [])

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
        location: { column_end: 0, column_start: 0, file_path: selectedFile ?? '', line_end: e.line, line_start: e.line },
        name: e.name,
        signature: e.signature,
      }))
    }
    return symbols
  }, [exports, selectedFile, symbolMode, symbols])

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

  if (treeLoading) {
    return <PageLoader />
  }

  const rootNodes = fileTree.get('') ?? []

  return (
    <Stack>
      <Title order={2}>Code Explorer</Title>

      <ErrorAlert
        error={error}
        onClose={() => setError(null)}
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
              {rootNodes.length > 0 ? (
                <Stack gap={0}>
                  {rootNodes.map((node) => (
                    <FileTreeNode
                      expanded={expanded}
                      fileTree={fileTree}
                      key={node.path}
                      level={0}
                      node={node}
                      onExpand={handleExpand}
                      onSelect={loadSymbols}
                      selectedFile={selectedFile}
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
          {selectedFile ? (
            <>
              <Text
                c='dimmed'
                ff='monospace'
                size='sm'
              >
                {selectedFile}
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
                selectedFile={selectedFile}
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
