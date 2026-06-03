import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MemoryIndex } from '../../../lib/types'
import * as queries from '../../../lib/queries'
import { renderWithProviders } from '../../../test/render'
import { FileMemorySection } from '../FileMemorySection'

type MockHook = ReturnType<typeof queries.useMemoryIndex>

function mockMemoryIndex(data: MemoryIndex | undefined, isLoading = false) {
  vi.spyOn(queries, 'useMemoryIndex').mockReturnValue({ data, isLoading } as unknown as MockHook)
}

describe('FileMemorySection', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders index entries', () => {
    mockMemoryIndex({
      entries: [{ file: 'rag.md', hook: 'investigate graph view', lineNumber: 1, title: 'RAG visual' }],
      orphanFiles: [],
      rawMarkdown: '',
    })

    renderWithProviders(<FileMemorySection />)

    expect(screen.getByText('RAG visual')).toBeInTheDocument()
    expect(screen.getByText('rag.md')).toBeInTheDocument()
    expect(screen.getByText('investigate graph view')).toBeInTheDocument()
  })

  it('renders orphan files when present', () => {
    mockMemoryIndex({
      entries: [],
      orphanFiles: ['stray.md'],
      rawMarkdown: '',
    })

    renderWithProviders(<FileMemorySection />)

    expect(screen.getByText('Orphan files (not in index)')).toBeInTheDocument()
    expect(screen.getByText('stray.md')).toBeInTheDocument()
  })

  it('renders an empty state when there are no entries or orphans', () => {
    mockMemoryIndex({ entries: [], orphanFiles: [], rawMarkdown: '' })

    renderWithProviders(<FileMemorySection />)

    expect(screen.getByText('No file memory yet')).toBeInTheDocument()
  })

  it('renders the empty state when the query returned no data (Hyphae-down fallback)', () => {
    mockMemoryIndex(undefined)

    renderWithProviders(<FileMemorySection />)

    expect(screen.getByText('No file memory yet')).toBeInTheDocument()
  })
})
