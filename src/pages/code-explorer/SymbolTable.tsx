import { Badge, Button, Code, Group, Loader, Stack, Table, Text, UnstyledButton } from '@mantine/core'
import { IconChevronRight, IconLink } from '@tabler/icons-react'
import { Fragment, useState } from 'react'

import type { RhizomeSymbol, SymbolDefinition } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { symbolKindColor } from '../../lib/colors'
import { onActivate } from '../../lib/keyboard'
import { useReferences } from '../../lib/queries'

interface SymbolTableProps {
  defLoading: boolean
  defPreview: string
  definition: SymbolDefinition | undefined
  expandedSymbol: string | null
  filteredSymbols: RhizomeSymbol[]
  hasMoreLines: boolean
  onSymbolClick: (name: string) => void
  selectedFile: string | null
  showFullDef: boolean
  onToggleFullDef: () => void
}

export function SymbolTable({
  defLoading,
  defPreview,
  definition,
  expandedSymbol,
  filteredSymbols,
  hasMoreLines,
  onSymbolClick,
  selectedFile,
  showFullDef,
  onToggleFullDef,
}: SymbolTableProps) {
  const [showReferences, setShowReferences] = useState(false)

  const currentSymbol = filteredSymbols.find((s) => s.name === expandedSymbol)
  const { data: references = [], isLoading: referencesLoading } = useReferences(
    selectedFile ?? '',
    currentSymbol?.location.line_start ?? 0,
    currentSymbol?.location.column_start ?? 0,
    showReferences
  )
  return (
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
            <Fragment key={sym.name}>
              <Table.Tr
                onClick={() => onSymbolClick(sym.name)}
                onKeyDown={onActivate(() => onSymbolClick(sym.name))}
                style={{ cursor: 'pointer' }}
                tabIndex={0}
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
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    {defLoading ? (
                      <Loader size='sm' />
                    ) : definition ? (
                      <Stack gap='md'>
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
                          <UnstyledButton onClick={onToggleFullDef}>
                            <Text
                              c='mycelium'
                              size='xs'
                            >
                              {showFullDef ? 'Show preview' : 'View full definition'}
                            </Text>
                          </UnstyledButton>
                        )}

                        <div>
                          <Button
                            disabled={referencesLoading}
                            leftSection={<IconLink size={14} />}
                            onClick={() => setShowReferences(!showReferences)}
                            size='xs'
                            variant={showReferences ? 'filled' : 'light'}
                          >
                            {showReferences ? 'Hide' : 'Find'} References
                          </Button>

                          {showReferences && (
                            <Stack
                              gap='xs'
                              mt='sm'
                            >
                              {referencesLoading && <Loader size='sm' />}
                              {!referencesLoading && references.length === 0 && (
                                <Text
                                  c='dimmed'
                                  size='xs'
                                >
                                  No references found
                                </Text>
                              )}
                              {!referencesLoading && references.length > 0 && (
                                <Stack gap={0}>
                                  <Text
                                    c='dimmed'
                                    fw={500}
                                    size='xs'
                                  >
                                    References ({references.length})
                                  </Text>
                                  {references.map((ref) => (
                                    <Text
                                      ff='monospace'
                                      key={`${ref.file_path}-${ref.line_start}`}
                                      size='xs'
                                    >
                                      <Text
                                        c='mycelium'
                                        component='span'
                                        ff='monospace'
                                        fw={500}
                                      >
                                        {ref.file_path.split('/').pop()}
                                      </Text>
                                      :{ref.line_start}:{ref.column_start}
                                    </Text>
                                  ))}
                                </Stack>
                              )}
                            </Stack>
                          )}
                        </div>
                      </Stack>
                    ) : null}
                  </Table.Td>
                </Table.Tr>
              )}
            </Fragment>
          ))}
        </Table.Tbody>
      </Table>
    </SectionCard>
  )
}
