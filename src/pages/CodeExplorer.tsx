import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Code,
  Group,
  Loader,
  NavLink,
  ScrollArea,
  SegmentedControl,
  Stack,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronRight, IconFile, IconFolder, IconFolderOpen, IconLayoutSidebar } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { FileNode } from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { SectionCard } from '../components/SectionCard'
import { rhizomeApi } from '../lib/api'
import { symbolKindColor } from '../lib/colors'
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

function annotationColor(kind: string): string {
  switch (kind.toUpperCase()) {
    case 'TODO':
      return 'substrate'
    case 'FIXME':
      return 'gill'
    case 'HACK':
      return 'decay'
    default:
      return 'chitin'
  }
}

function complexityColor(score: number): string {
  if (score < 5) return 'green'
  if (score <= 10) return 'yellow'
  return 'red'
}

function FileTreeNode({
  expanded,
  fileTree,
  level,
  node,
  onExpand,
  onSelect,
  selectedFile,
}: {
  expanded: Set<string>
  fileTree: Map<string, FileNode[]>
  level: number
  node: FileNode
  onExpand: (path: string) => void
  onSelect: (path: string) => void
  selectedFile: string | null
}) {
  const isDir = node.type === 'dir'
  const isExpanded = expanded.has(node.path)
  const children = fileTree.get(node.path)

  return (
    <>
      <NavLink
        active={!isDir && selectedFile === node.path}
        label={node.name}
        leftSection={isDir ? isExpanded ? <IconFolderOpen size={16} /> : <IconFolder size={16} /> : <IconFile size={16} />}
        onClick={() => (isDir ? onExpand(node.path) : onSelect(node.path))}
        opened={isDir ? isExpanded : undefined}
        style={{ paddingLeft: level * 12 }}
      />
      {isDir &&
        isExpanded &&
        children?.map((child) => (
          <FileTreeNode
            expanded={expanded}
            fileTree={fileTree}
            key={child.path}
            level={level + 1}
            node={child}
            onExpand={onExpand}
            onSelect={onSelect}
            selectedFile={selectedFile}
          />
        ))}
    </>
  )
}

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

  const defPreview = useMemo(() => {
    if (!definition?.body) return ''
    const lines = definition.body.split('\n')
    return lines.slice(0, 20).join('\n')
  }, [definition])

  const hasMoreLines = useMemo(() => {
    if (!definition?.body) return false
    return definition.body.split('\n').length > 20
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
                <SectionCard>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Kind</Table.Th>
                        <Table.Th>Line</Table.Th>
                        <Table.Th>Signature</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredSymbols.map((sym) => (
                        <>
                          <Table.Tr
                            key={sym.name}
                            onClick={() => handleSymbolClick(sym.name)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Table.Td>
                              <Group gap='xs'>
                                <IconChevronRight
                                  size={14}
                                  style={{
                                    transform: expandedSymbol === sym.name ? 'rotate(90deg)' : 'none',
                                    transition: 'transform 150ms',
                                  }}
                                />
                                <Text
                                  fw={500}
                                  size='sm'
                                >
                                  {sym.name}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={symbolKindColor(sym.kind)}
                                size='sm'
                                variant='light'
                              >
                                {sym.kind}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size='sm'>{sym.location.line_start}</Text>
                            </Table.Td>
                            <Table.Td maw={300}>
                              {sym.signature ? (
                                <Text
                                  ff='monospace'
                                  lineClamp={1}
                                  size='xs'
                                >
                                  {sym.signature}
                                </Text>
                              ) : (
                                <Text
                                  c='dimmed'
                                  size='xs'
                                >
                                  —
                                </Text>
                              )}
                            </Table.Td>
                          </Table.Tr>
                          {expandedSymbol === sym.name && (
                            <Table.Tr key={`${sym.name}-def`}>
                              <Table.Td colSpan={4}>
                                {defLoading ? (
                                  <Loader size='sm' />
                                ) : definition ? (
                                  <Stack gap='xs'>
                                    {definition.doc_comment && (
                                      <Text
                                        c='dimmed'
                                        size='xs'
                                        style={{ whiteSpace: 'pre-wrap' }}
                                      >
                                        {definition.doc_comment}
                                      </Text>
                                    )}
                                    <Code block>{showFullDef ? definition.body : defPreview}</Code>
                                    {hasMoreLines && (
                                      <UnstyledButton onClick={() => setShowFullDef((v) => !v)}>
                                        <Text
                                          c='mycelium'
                                          size='xs'
                                        >
                                          {showFullDef ? 'Show preview' : 'View full definition'}
                                        </Text>
                                      </UnstyledButton>
                                    )}
                                  </Stack>
                                ) : null}
                              </Table.Td>
                            </Table.Tr>
                          )}
                        </>
                      ))}
                    </Table.Tbody>
                  </Table>
                </SectionCard>
              )}

              {!(symbolsLoading || (symbolMode === 'exports' && exportsLoading)) &&
                filteredSymbols.length === 0 &&
                displaySymbols.length > 0 && <EmptyState>No symbols match "{symbolFilter}"</EmptyState>}

              {!(symbolsLoading || (symbolMode === 'exports' && exportsLoading)) && displaySymbols.length === 0 && (
                <EmptyState>
                  {symbolMode === 'exports' ? 'No exported symbols found in this file' : 'No symbols found in this file'}
                </EmptyState>
              )}

              <SectionCard>
                <Tabs defaultValue='annotations'>
                  <Tabs.List>
                    <Tabs.Tab value='annotations'>
                      Annotations{' '}
                      {!annotationsLoading && annotations.length > 0 && (
                        <Badge
                          ml={4}
                          size='xs'
                          variant='light'
                        >
                          {annotations.length}
                        </Badge>
                      )}
                    </Tabs.Tab>
                    <Tabs.Tab value='complexity'>
                      Complexity{' '}
                      {!complexityLoading && complexity.length > 0 && (
                        <Badge
                          ml={4}
                          size='xs'
                          variant='light'
                        >
                          {complexity.length}
                        </Badge>
                      )}
                    </Tabs.Tab>
                    <Tabs.Tab value='callSites'>
                      Call Sites{' '}
                      {!callSitesLoading && callSites.length > 0 && (
                        <Badge
                          color='spore'
                          ml={4}
                          size='xs'
                          variant='light'
                        >
                          {callSites.length}
                        </Badge>
                      )}
                    </Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel
                    pt='sm'
                    value='annotations'
                  >
                    {annotationsLoading && <Loader size='sm' />}
                    {!annotationsLoading && annotations.length === 0 && (
                      <Text
                        c='dimmed'
                        size='sm'
                      >
                        No TODO, FIXME, or HACK comments found
                      </Text>
                    )}
                    {!annotationsLoading && annotations.length > 0 && (
                      <Stack gap='xs'>
                        {annotations.map((a, i) => (
                          <Alert
                            color={annotationColor(a.kind)}
                            key={`${a.kind}-${a.line}-${a.message}`}
                            p='xs'
                            variant='light'
                          >
                            <Group gap='xs'>
                              <Badge
                                color={annotationColor(a.kind)}
                                size='xs'
                                variant='filled'
                              >
                                {a.kind}
                              </Badge>
                              <Text
                                c='dimmed'
                                ff='monospace'
                                size='xs'
                              >
                                L{a.line}
                              </Text>
                              <Text size='sm'>{a.message}</Text>
                            </Group>
                          </Alert>
                        ))}
                      </Stack>
                    )}
                  </Tabs.Panel>

                  <Tabs.Panel
                    pt='sm'
                    value='complexity'
                  >
                    {complexityLoading && <Loader size='sm' />}
                    {!complexityLoading && complexity.length === 0 && (
                      <Text
                        c='dimmed'
                        size='sm'
                      >
                        No complexity data available
                      </Text>
                    )}
                    {!complexityLoading && complexity.length > 0 && (
                      <Table highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Function</Table.Th>
                            <Table.Th>Line</Table.Th>
                            <Table.Th>Complexity</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {complexity.map((c) => (
                            <Table.Tr key={`${c.name}-${c.line}`}>
                              <Table.Td>
                                <Text
                                  ff='monospace'
                                  size='sm'
                                >
                                  {c.name}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size='sm'>{c.line}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  color={complexityColor(c.complexity)}
                                  size='sm'
                                  variant='light'
                                >
                                  {c.complexity}
                                </Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Tabs.Panel>

                  <Tabs.Panel
                    pt='sm'
                    value='callSites'
                  >
                    {callSitesLoading && <Loader size='sm' />}
                    {!callSitesLoading && callSites.length === 0 && (
                      <Text
                        c='dimmed'
                        size='sm'
                      >
                        No call sites found
                      </Text>
                    )}
                    {!callSitesLoading && callSites.length > 0 && (
                      <Table highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Caller</Table.Th>
                            <Table.Th>Line</Table.Th>
                            <Table.Th>Call Expression</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {callSites.map((cs) => (
                            <Table.Tr key={`${cs.caller}-${cs.line}-${cs.call_expression}`}>
                              <Table.Td>
                                <Text
                                  ff='monospace'
                                  size='sm'
                                >
                                  {cs.caller}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size='sm'>{cs.line}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text
                                  ff='monospace'
                                  lineClamp={1}
                                  size='xs'
                                >
                                  {cs.call_expression}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Tabs.Panel>
                </Tabs>
              </SectionCard>
            </>
          ) : (
            <EmptyState>Select a file to explore its symbols</EmptyState>
          )}
        </Stack>
      </Group>
    </Stack>
  )
}
