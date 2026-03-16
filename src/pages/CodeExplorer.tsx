import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Card,
  Code,
  Group,
  Loader,
  NavLink,
  ScrollArea,
  Stack,
  Table,
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
import { rhizomeApi } from '../lib/api'
import { rhizomeKeys, useDefinition, useFileTree, useRhizomeStatus, useSymbols } from '../lib/queries'

function symbolKindColor(kind: string): string {
  switch (kind.toLowerCase()) {
    case 'function':
    case 'method':
      return 'mycelium'
    case 'class':
    case 'struct':
      return 'spore'
    case 'enum':
      return 'substrate'
    case 'interface':
    case 'trait':
      return 'lichen'
    case 'constant':
    case 'const':
      return 'gill'
    case 'import':
    case 'use':
      return 'chitin'
    default:
      return 'chitin'
  }
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
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null)
  const [showFullDef, setShowFullDef] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedDirs, setLoadedDirs] = useState<Set<string>>(new Set())

  // Queries
  const { data: statusData } = useRhizomeStatus()
  const unavailable = statusData ? !statusData.available : false
  const { data: initialTree, isLoading: treeLoading } = useFileTree(undefined, 2)
  const { data: symbols = [], isLoading: symbolsLoading } = useSymbols(selectedFile ?? '')
  const { data: definition, isLoading: defLoading } = useDefinition(selectedFile ?? '', expandedSymbol ?? '')

  // Build tree map from initial query
  useEffect(() => {
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

  // Auto-expand to file from URL params
  useEffect(() => {
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

  const filteredSymbols = useMemo(() => {
    if (!symbolFilter.trim()) return symbols
    const q = symbolFilter.toLowerCase()
    return symbols.filter((s) => s.name.toLowerCase().includes(q))
  }, [symbols, symbolFilter])

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
        <Alert
          color='decay'
          title='Rhizome Unavailable'
        >
          The Rhizome code intelligence service is not available. Make sure it is running and configured correctly to explore code symbols.
        </Alert>
      </Stack>
    )
  }

  if (treeLoading) {
    return (
      <Group
        justify='center'
        mt='xl'
      >
        <Loader />
      </Group>
    )
  }

  const rootNodes = fileTree.get('') ?? []

  return (
    <Stack>
      <Title order={2}>Code Explorer</Title>

      {error && (
        <Alert
          color='decay'
          onClose={() => setError(null)}
          title='Error'
          withCloseButton
        >
          {error}
        </Alert>
      )}

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
          <Card
            miw={280}
            padding='lg'
            shadow='sm'
            withBorder
          >
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
                <Text
                  c='dimmed'
                  size='sm'
                >
                  No files found
                </Text>
              )}
            </ScrollArea>
          </Card>
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

              <TextInput
                onChange={(e) => setSymbolFilter(e.currentTarget.value)}
                placeholder='Filter symbols...'
                value={symbolFilter}
              />

              {symbolsLoading && <Loader size='sm' />}

              {!symbolsLoading && filteredSymbols.length > 0 && (
                <Card
                  padding='lg'
                  shadow='sm'
                  withBorder
                >
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
                </Card>
              )}

              {!symbolsLoading && filteredSymbols.length === 0 && symbols.length > 0 && (
                <Text
                  c='dimmed'
                  size='sm'
                >
                  No symbols match "{symbolFilter}"
                </Text>
              )}

              {!symbolsLoading && symbols.length === 0 && (
                <Text
                  c='dimmed'
                  size='sm'
                >
                  No symbols found in this file
                </Text>
              )}
            </>
          ) : (
            <Text
              c='dimmed'
              size='sm'
            >
              Select a file to explore its symbols
            </Text>
          )}
        </Stack>
      </Group>
    </Stack>
  )
}
