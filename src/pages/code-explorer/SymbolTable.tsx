import { Loader, Stack, Table } from '@mantine/core'
import { Fragment, useEffect, useMemo, useState } from 'react'

import type { RhizomeCopyMoveResult, RhizomeSymbol, SymbolDefinition } from '../../lib/api'
import { SectionCard } from '../../components/SectionCard'
import { useCopySymbol, useMoveSymbol, useReferences, useRenameSymbol } from '../../lib/queries'
import { SymbolDefinitionPanel } from './SymbolDefinitionPanel'
import { SymbolEditActions } from './SymbolEditActions'
import { SymbolReferencesPanel } from './SymbolReferencesPanel'
import { SymbolTableRow } from './SymbolTableRow'

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
              <SymbolTableRow
                expanded={expandedSymbol === sym.name}
                onToggle={() => onSymbolClick(sym.name)}
                symbol={sym}
              />
              {expandedSymbol === sym.name && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    {defLoading ? (
                      <Loader size='sm' />
                    ) : definition ? (
                      <Stack gap='md'>
                        <SymbolDefinitionPanel
                          definition={definition}
                          defPreview={defPreview}
                          hasMoreLines={hasMoreLines}
                          onToggleFullDef={onToggleFullDef}
                          showFullDef={showFullDef}
                        />

                        <SymbolEditActions
                          actionBusy={actionBusy}
                          activeAction={activeAction}
                          activeError={activeError}
                          canSubmitCopyMove={canSubmitCopyMove}
                          canSubmitRename={canSubmitRename}
                          copyPending={copySymbol.isPending}
                          lastResult={lastResult}
                          movePending={moveSymbol.isPending}
                          onApplyCopyMove={(action) => void handleCopyMove(action)}
                          onApplyRename={() => void handleRename()}
                          onCancel={() => setActiveAction(null)}
                          onChangePosition={setPosition}
                          onChangeRenameValue={setRenameValue}
                          onChangeTargetFile={setTargetFile}
                          onChangeTargetSymbol={setTargetSymbol}
                          onToggleAction={(action) => setActiveAction(activeAction === action ? null : action)}
                          position={position}
                          renamePending={renameSymbol.isPending}
                          renameValue={renameValue}
                          targetFile={targetFile}
                          targetSymbol={targetSymbol}
                        />

                        <SymbolReferencesPanel
                          onToggle={() => setShowReferences(!showReferences)}
                          references={references}
                          referencesLoading={referencesLoading}
                          showReferences={showReferences}
                        />
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
