import { Badge, Code, Group, Loader, Stack, Table, Text, UnstyledButton } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { Fragment } from 'react'

import type { RhizomeSymbol, SymbolDefinition } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { symbolKindColor } from '../../lib/colors'
import { onActivate } from '../../lib/keyboard'

interface SymbolTableProps {
  defLoading: boolean
  defPreview: string
  definition: SymbolDefinition | undefined
  expandedSymbol: string | null
  filteredSymbols: RhizomeSymbol[]
  hasMoreLines: boolean
  onSymbolClick: (name: string) => void
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
  showFullDef,
  onToggleFullDef,
}: SymbolTableProps) {
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
                          <UnstyledButton onClick={onToggleFullDef}>
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
            </Fragment>
          ))}
        </Table.Tbody>
      </Table>
    </SectionCard>
  )
}
