import { Alert, Badge, Button, Code, Group, Loader, SegmentedControl, Stack, Table, Text, TextInput, UnstyledButton } from '@mantine/core'
import { IconArrowsMove, IconChevronRight, IconCopy, IconEdit, IconInfoCircle, IconLink } from '@tabler/icons-react'
import { Fragment, useEffect, useMemo, useState } from 'react'

import type { RhizomeCopyMoveResult, RhizomeSymbol, SymbolDefinition } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { symbolKindColor } from '../../lib/colors'
import { onActivate } from '../../lib/keyboard'
import { useCopySymbol, useMoveSymbol, useReferences, useRenameSymbol } from '../../lib/queries'

type EditAction = 'copy' | 'move' | 'rename'

function buildCopyMoveSummary(action: 'copy' | 'move', result: RhizomeCopyMoveResult): string {
  const lineCount = result.lines_moved ?? result.lines_copied ?? result.lines_inserted
  const verb = action === 'move' ? 'Moved' : 'Copied'
  return `${verb} ${lineCount} lines into ${result.target_file} ${result.position} ${result.target_symbol} at line ${result.inserted_at_line}.`
}

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
  const [activeAction, setActiveAction] = useState<EditAction | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [targetFile, setTargetFile] = useState(selectedFile ?? '')
  const [targetSymbol, setTargetSymbol] = useState('')
  const [position, setPosition] = useState<'before' | 'after'>('after')
  const [lastResult, setLastResult] = useState<string | null>(null)

  const renameSymbol = useRenameSymbol()
  const copySymbol = useCopySymbol()
  const moveSymbol = useMoveSymbol()

  const currentSymbol = filteredSymbols.find((s) => s.name === expandedSymbol)
  const { data: references = [], isLoading: referencesLoading } = useReferences(
    selectedFile ?? '',
    currentSymbol?.location.line_start ?? 0,
    currentSymbol?.location.column_start ?? 0,
    showReferences
  )

  useEffect(() => {
    if (!currentSymbol) {
      setActiveAction(null)
      setLastResult(null)
      return
    }
    setRenameValue(currentSymbol.name)
    setTargetFile(selectedFile ?? '')
    setTargetSymbol('')
    setPosition('after')
    setLastResult(null)
  }, [currentSymbol, selectedFile])

  const activeError = useMemo(() => {
    if (renameSymbol.error instanceof Error) return renameSymbol.error.message
    if (copySymbol.error instanceof Error) return copySymbol.error.message
    if (moveSymbol.error instanceof Error) return moveSymbol.error.message
    return null
  }, [copySymbol.error, moveSymbol.error, renameSymbol.error])

  const actionBusy = renameSymbol.isPending || copySymbol.isPending || moveSymbol.isPending

  const handleRename = async () => {
    if (!selectedFile || !currentSymbol) return
    const result = await renameSymbol.mutateAsync({
      column: currentSymbol.location.column_start,
      file: selectedFile,
      line: currentSymbol.location.line_start,
      new_name: renameValue.trim(),
    })
    setLastResult(typeof result === 'string' ? result : `Renamed ${currentSymbol.name} to ${renameValue.trim()}.`)
    setActiveAction(null)
  }

  const handleCopyMove = async (action: 'copy' | 'move') => {
    if (!selectedFile || !currentSymbol) return
    const result = await (action === 'copy' ? copySymbol : moveSymbol).mutateAsync({
      position,
      source_file: selectedFile,
      symbol: currentSymbol.name,
      target_file: targetFile.trim(),
      target_symbol: targetSymbol.trim(),
    })
    setLastResult(buildCopyMoveSummary(action, result))
    setActiveAction(null)
  }

  const canSubmitRename = !!renameValue.trim() && renameValue.trim() !== currentSymbol?.name
  const canSubmitCopyMove = !!targetFile.trim() && !!targetSymbol.trim()

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

                        <Stack gap='xs'>
                          <Group gap='xs'>
                            <Button
                              leftSection={<IconEdit size={14} />}
                              onClick={() => setActiveAction(activeAction === 'rename' ? null : 'rename')}
                              size='xs'
                              variant={activeAction === 'rename' ? 'filled' : 'light'}
                            >
                              Rename
                            </Button>
                            <Button
                              leftSection={<IconCopy size={14} />}
                              onClick={() => setActiveAction(activeAction === 'copy' ? null : 'copy')}
                              size='xs'
                              variant={activeAction === 'copy' ? 'filled' : 'light'}
                            >
                              Copy
                            </Button>
                            <Button
                              leftSection={<IconArrowsMove size={14} />}
                              onClick={() => setActiveAction(activeAction === 'move' ? null : 'move')}
                              size='xs'
                              variant={activeAction === 'move' ? 'filled' : 'light'}
                            >
                              Move
                            </Button>
                          </Group>

                          {lastResult && (
                            <Alert
                              color='green'
                              icon={<IconInfoCircle size={16} />}
                              variant='light'
                            >
                              <Text size='sm'>{lastResult}</Text>
                            </Alert>
                          )}

                          {activeError && (
                            <Alert
                              color='red'
                              icon={<IconInfoCircle size={16} />}
                              variant='light'
                            >
                              <Text size='sm'>{activeError}</Text>
                            </Alert>
                          )}

                          {activeAction === 'rename' && currentSymbol && (
                            <Stack gap='xs'>
                              <Text
                                c='dimmed'
                                size='xs'
                              >
                                Rename this symbol in place. The update is delegated to Rhizome&apos;s symbol rename workflow.
                              </Text>
                              <TextInput
                                label='New symbol name'
                                onChange={(event) => setRenameValue(event.currentTarget.value)}
                                placeholder='newSymbolName'
                                value={renameValue}
                              />
                              <Group gap='xs'>
                                <Button
                                  disabled={!canSubmitRename || actionBusy}
                                  loading={renameSymbol.isPending}
                                  onClick={() => void handleRename()}
                                  size='xs'
                                >
                                  Apply rename
                                </Button>
                                <Button
                                  onClick={() => setActiveAction(null)}
                                  size='xs'
                                  variant='subtle'
                                >
                                  Cancel
                                </Button>
                              </Group>
                            </Stack>
                          )}

                          {(activeAction === 'copy' || activeAction === 'move') && currentSymbol && (
                            <Stack gap='xs'>
                              <Text
                                c='dimmed'
                                size='xs'
                              >
                                {activeAction === 'move'
                                  ? 'Move this symbol relative to another symbol. Same-file moves may be rejected by Rhizome in this MVP.'
                                  : 'Copy this symbol relative to another symbol in the target file.'}
                              </Text>
                              <TextInput
                                label='Target file'
                                onChange={(event) => setTargetFile(event.currentTarget.value)}
                                placeholder='src/example.ts'
                                value={targetFile}
                              />
                              <TextInput
                                label='Target symbol'
                                onChange={(event) => setTargetSymbol(event.currentTarget.value)}
                                placeholder='ExistingTargetSymbol'
                                value={targetSymbol}
                              />
                              <SegmentedControl
                                data={[
                                  { label: 'Before', value: 'before' },
                                  { label: 'After', value: 'after' },
                                ]}
                                onChange={(value) => setPosition(value as 'before' | 'after')}
                                size='xs'
                                value={position}
                              />
                              <Group gap='xs'>
                                <Button
                                  disabled={!canSubmitCopyMove || actionBusy}
                                  loading={activeAction === 'copy' ? copySymbol.isPending : moveSymbol.isPending}
                                  onClick={() => void handleCopyMove(activeAction)}
                                  size='xs'
                                >
                                  {activeAction === 'copy' ? 'Copy symbol' : 'Move symbol'}
                                </Button>
                                <Button
                                  onClick={() => setActiveAction(null)}
                                  size='xs'
                                  variant='subtle'
                                >
                                  Cancel
                                </Button>
                              </Group>
                            </Stack>
                          )}
                        </Stack>

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
