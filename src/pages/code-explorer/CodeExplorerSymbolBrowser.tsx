import { Badge, Button, Group, Loader, SegmentedControl, Stack, Text, TextInput, Title } from '@mantine/core'
import { Link } from 'react-router-dom'

import type { RhizomeSymbol, SymbolDefinition } from '../../lib/api'
import { EmptyState } from '../../components/EmptyState'
import { SectionCard } from '../../components/SectionCard'
import { SymbolTable } from './SymbolTable'

interface ExportSymbol {
  kind: string
  line: number
  name: string
  signature?: string | null
}

interface FileSummaryData {
  description?: string | null
  exports: number
  functions: number
  imports: number
  language: string
  lines: number
  types: number
}

interface CodeExplorerSymbolBrowserProps {
  defLoading: boolean
  defPreview: string
  definition: SymbolDefinition | undefined
  displaySymbols: RhizomeSymbol[]
  expandedSymbol: string | null
  exports: ExportSymbol[]
  exportsLoading: boolean
  fileSummary?: FileSummaryData
  filteredSymbols: RhizomeSymbol[]
  hasMoreLines: boolean
  isCodeFile: boolean
  onSymbolClick: (name: string) => void
  onSymbolFilterChange: (value: string) => void
  onSymbolModeChange: (mode: 'all' | 'exports') => void
  onToggleFullDef: () => void
  selectedFile: string
  searchMemoriesHref: string
  searchMemoirsHref: string
  searchSymbolsHref: string
  showFullDef: boolean
  symbolFilter: string
  symbolMode: 'all' | 'exports'
  symbolsLoading: boolean
}

export function CodeExplorerSymbolBrowser({
  defLoading,
  defPreview,
  definition,
  displaySymbols,
  expandedSymbol,
  exports,
  exportsLoading,
  fileSummary,
  filteredSymbols,
  hasMoreLines,
  isCodeFile,
  onSymbolClick,
  onSymbolFilterChange,
  onSymbolModeChange,
  onToggleFullDef,
  selectedFile,
  searchMemoriesHref,
  searchMemoirsHref,
  searchSymbolsHref,
  showFullDef,
  symbolFilter,
  symbolMode,
  symbolsLoading,
}: CodeExplorerSymbolBrowserProps) {
  const loading = symbolsLoading || (symbolMode === 'exports' && exportsLoading)

  return (
    <SectionCard>
      <Stack gap='md'>
        <Stack gap={4}>
          <Title order={4}>Symbols</Title>
          <Text
            c='dimmed'
            ff='monospace'
            size='sm'
          >
            {selectedFile}
          </Text>
          {fileSummary && (
            <>
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
            </>
          )}
        </Stack>

        <Group
          align='end'
          justify='space-between'
        >
          <SegmentedControl
            aria-label='Symbol mode'
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
            onChange={(value) => onSymbolModeChange(value as 'all' | 'exports')}
            size='xs'
            value={symbolMode}
          />

          <TextInput
            aria-label='Filter symbols'
            maw={320}
            onChange={(event) => onSymbolFilterChange(event.currentTarget.value)}
            placeholder='Filter symbols'
            value={symbolFilter}
          />
        </Group>

        <Group gap='xs'>
          <Button
            component={Link}
            size='xs'
            to={searchMemoirsHref}
            variant='subtle'
          >
            Open memoirs
          </Button>
          {expandedSymbol && (
            <>
              <Button
                component={Link}
                size='xs'
                to={searchMemoriesHref}
                variant='light'
              >
                Search memories
              </Button>
              <Button
                component={Link}
                size='xs'
                to={searchSymbolsHref}
                variant='subtle'
              >
                Search symbol index
              </Button>
            </>
          )}
        </Group>

        {loading && (
          <Group
            aria-live='polite'
            justify='center'
            role='status'
          >
            <Loader size='sm' />
            <Text
              c='dimmed'
              size='sm'
            >
              Loading symbols
            </Text>
          </Group>
        )}

        {!loading && filteredSymbols.length > 0 && (
          <SymbolTable
            definition={definition}
            defLoading={defLoading}
            defPreview={defPreview}
            expandedSymbol={expandedSymbol}
            filteredSymbols={filteredSymbols}
            hasMoreLines={hasMoreLines}
            onSymbolClick={onSymbolClick}
            onToggleFullDef={onToggleFullDef}
            selectedFile={selectedFile}
            showFullDef={showFullDef}
          />
        )}

        {!loading && filteredSymbols.length === 0 && displaySymbols.length > 0 && (
          <EmptyState>No symbols match "{symbolFilter}"</EmptyState>
        )}

        {!loading && displaySymbols.length === 0 && (
          <EmptyState>
            {!isCodeFile
              ? 'Code intelligence is not available for this file type'
              : symbolMode === 'exports'
                ? 'No exported symbols found in this file'
                : 'No symbols found in this file'}
          </EmptyState>
        )}
      </Stack>
    </SectionCard>
  )
}
