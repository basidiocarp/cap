import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { createRhizomeSymbol, createSymbolDefinition } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { CodeExplorer } from './CodeExplorer'

vi.mock('../lib/queries', () => ({
  useDefinition: vi.fn((_file: string, symbol: string) => ({
    data: symbol ? createSymbolDefinition({ name: symbol }) : undefined,
    isLoading: false,
  })),
  useExports: vi.fn(() => ({
    data: [{ kind: 'function', line: 4, name: 'renderStatus', signature: 'function renderStatus(): void' }],
    isLoading: false,
  })),
  useFileSummary: vi.fn(() => ({
    data: {
      description: 'Status helpers',
      exports: 1,
      functions: 3,
      imports: 2,
      language: 'TypeScript',
      lines: 42,
      types: 1,
    },
    isLoading: false,
  })),
  useProject: vi.fn(() => ({
    data: {
      active: '/workspace/cap',
      recent: ['/workspace/cap', '/workspace/hyphae'],
    },
  })),
  useRhizomeStatus: vi.fn(() => ({
    data: { available: true, backend: 'lsp', languages: ['typescript'] },
  })),
  useSymbols: vi.fn(() => ({
    data: [
      createRhizomeSymbol({
        location: {
          column_end: 10,
          column_start: 2,
          file_path: 'src/status.ts',
          line_end: 12,
          line_start: 4,
        },
        name: 'renderStatus',
      }),
    ],
    isLoading: false,
  })),
}))

vi.mock('../hooks/useFileTreeState', () => ({
  useFileTreeState: vi.fn(() => ({
    error: null,
    expanded: new Set<string>(),
    fileTree: new Map(),
    handleExpand: vi.fn(),
    loadSymbols: vi.fn(),
    rootNodes: [],
    selectedFile: null,
    setError: vi.fn(),
    treeLoading: false,
  })),
}))

vi.mock('./code-explorer/CodeExplorerHeader', () => ({
  CodeExplorerHeader: ({ projectName }: { projectName: string }) => <div>Explorer header: {projectName}</div>,
}))

vi.mock('./code-explorer/CodeExplorerSidebar', () => ({
  CodeExplorerSidebar: ({ onSelect }: { onSelect: (filePath: string) => void }) => (
    <button
      onClick={() => onSelect('src/other.ts')}
      type='button'
    >
      Select src/other.ts
    </button>
  ),
}))

vi.mock('./code-explorer/FileDetailTabs', () => ({
  FileDetailTabs: ({ selectedFile }: { selectedFile: string | null }) => <div>File details for {selectedFile}</div>,
}))

vi.mock('./code-explorer/SymbolTable', () => ({
  SymbolTable: ({ filteredSymbols }: { filteredSymbols: Array<{ name: string }> }) => (
    <div>Symbol table rows: {filteredSymbols.map((symbol) => symbol.name).join(', ')}</div>
  ),
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid='location-search'>{location.search}</div>
}

describe('CodeExplorer page', () => {
  it('hydrates from the url and updates search params through page interactions', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <>
        <CodeExplorer />
        <LocationProbe />
      </>,
      { route: '/code?file=src%2Fstatus.ts&symbol=renderStatus&filter=render&mode=exports' }
    )

    expect(screen.getByText('Explorer header: cap')).toBeInTheDocument()
    expect(screen.getByText('src/status.ts')).toBeInTheDocument()
    expect(screen.getByDisplayValue('render')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /exports only/i })).toBeChecked()
    expect(screen.getByText('File details for src/status.ts')).toBeInTheDocument()
    expect(screen.getByText('Symbol table rows: renderStatus')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'All' }))
    expect(screen.getByTestId('location-search').textContent).not.toContain('mode=exports')

    const filterInput = screen.getByRole('textbox', { name: 'Filter symbols' })
    await user.clear(filterInput)
    await user.type(filterInput, 'status')
    expect(screen.getByTestId('location-search').textContent).toContain('filter=status')
    expect(screen.getByTestId('location-search').textContent).not.toContain('symbol=')

    await user.click(screen.getByText('Select src/other.ts'))
    expect(screen.getByTestId('location-search').textContent).toContain('file=src%2Fother.ts')
    expect(screen.getByText('File details for src/other.ts')).toBeInTheDocument()
  })
})
