import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createRhizomeSymbol, createSymbolDefinition } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { CodeExplorerSymbolBrowser } from './CodeExplorerSymbolBrowser'

vi.mock('./SymbolTable', () => ({
  SymbolTable: ({ filteredSymbols }: { filteredSymbols: Array<{ name: string }> }) => (
    <div>Rendered symbol table with {filteredSymbols.length} symbol(s)</div>
  ),
}))

describe('CodeExplorerSymbolBrowser', () => {
  it('shows file summary and forwards symbol filter and mode changes', async () => {
    const user = userEvent.setup()
    const onSymbolFilterChange = vi.fn()
    const onSymbolModeChange = vi.fn()
    const symbol = createRhizomeSymbol()

    function BrowserHarness() {
      const [symbolFilter, setSymbolFilter] = useState('')
      const [symbolMode, setSymbolMode] = useState<'all' | 'exports'>('all')

      return (
        <CodeExplorerSymbolBrowser
          definition={createSymbolDefinition()}
          defLoading={false}
          defPreview='export function renderStatus() {}'
          displaySymbols={[symbol]}
          expandedSymbol={null}
          exports={[{ kind: 'function', line: 4, name: 'renderStatus', signature: 'function renderStatus(): void' }]}
          exportsLoading={false}
          fileSummary={{
            description: 'Status helpers',
            exports: 1,
            functions: 3,
            imports: 2,
            language: 'TypeScript',
            lines: 42,
            types: 1,
          }}
          filteredSymbols={symbolFilter ? [symbol].filter((item) => item.name.includes(symbolFilter)) : [symbol]}
          hasMoreLines={false}
          isCodeFile
          onSymbolClick={vi.fn()}
          onSymbolFilterChange={(value) => {
            setSymbolFilter(value)
            onSymbolFilterChange(value)
          }}
          onSymbolModeChange={(value) => {
            setSymbolMode(value)
            onSymbolModeChange(value)
          }}
          onToggleFullDef={vi.fn()}
          searchMemoirsHref='/memoirs?memoir=code%3Acap&concept=renderStatus'
          searchMemoriesHref='/memories?q=renderStatus'
          searchSymbolsHref='/symbols?q=renderStatus'
          selectedFile='src/status.ts'
          showFullDef={false}
          symbolFilter={symbolFilter}
          symbolMode={symbolMode}
          symbolsLoading={false}
        />
      )
    }

    renderWithProviders(<BrowserHarness />)

    expect(screen.getByText('src/status.ts')).toBeInTheDocument()
    expect(screen.getByText(/TypeScript · 42 lines · 3 functions · 1 types · 1 exports · 2 imports/i)).toBeInTheDocument()
    expect(screen.getByText('Status helpers')).toBeInTheDocument()
    expect(screen.getByText('Rendered symbol table with 1 symbol(s)')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /exports only/i }))
    expect(onSymbolModeChange).toHaveBeenCalledWith('exports')

    await user.type(screen.getByRole('textbox', { name: 'Filter symbols' }), 'render')
    expect(onSymbolFilterChange).toHaveBeenLastCalledWith('render')
  })

  it('renders loading and empty states for symbol results', () => {
    const symbol = createRhizomeSymbol()
    const { rerender } = renderWithProviders(
      <CodeExplorerSymbolBrowser
        definition={undefined}
        defLoading={false}
        defPreview=''
        displaySymbols={[symbol]}
        expandedSymbol={null}
        exports={[]}
        exportsLoading
        filteredSymbols={[]}
        hasMoreLines={false}
        isCodeFile
        onSymbolClick={vi.fn()}
        onSymbolFilterChange={vi.fn()}
        onSymbolModeChange={vi.fn()}
        onToggleFullDef={vi.fn()}
        searchMemoirsHref='/memoirs?memoir=code%3Acap&concept=renderStatus'
        searchMemoriesHref='/memories?q=renderStatus'
        searchSymbolsHref='/symbols?q=renderStatus'
        selectedFile='src/status.ts'
        showFullDef={false}
        symbolFilter=''
        symbolMode='exports'
        symbolsLoading={false}
      />
    )

    expect(screen.getByRole('status')).toHaveTextContent('Loading symbols')

    rerender(
      <CodeExplorerSymbolBrowser
        definition={undefined}
        defLoading={false}
        defPreview=''
        displaySymbols={[]}
        expandedSymbol={null}
        exports={[]}
        exportsLoading={false}
        filteredSymbols={[]}
        hasMoreLines={false}
        isCodeFile
        onSymbolClick={vi.fn()}
        onSymbolFilterChange={vi.fn()}
        onSymbolModeChange={vi.fn()}
        onToggleFullDef={vi.fn()}
        searchMemoirsHref='/memoirs?memoir=code%3Acap&concept=renderStatus'
        searchMemoriesHref='/memories?q=renderStatus'
        searchSymbolsHref='/symbols?q=renderStatus'
        selectedFile='src/status.ts'
        showFullDef={false}
        symbolFilter=''
        symbolMode='exports'
        symbolsLoading={false}
      />
    )

    expect(screen.getByText('No exported symbols found in this file')).toBeInTheDocument()
  })
})
