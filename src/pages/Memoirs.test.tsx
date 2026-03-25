import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { createConcept, createConceptInspection, createMemoir, createMemoirDetail } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { Memoirs } from './Memoirs'

vi.mock('../lib/queries', () => {
  const memoirs = [
    createMemoir({ description: 'Cap code graph', id: 'memoir-1', name: 'code:cap' }),
    createMemoir({ description: 'Hyphae code graph', id: 'memoir-2', name: 'code:hyphae' }),
  ]

  const details = {
    'code:cap': createMemoirDetail({
      concepts: [
        createConcept({ id: 'concept-1', name: 'getReadinessPanels' }),
        createConcept({ id: 'concept-2', name: 'HostCoveragePanel' }),
      ],
      memoir: memoirs[0],
      total_concepts: 2,
    }),
    'code:hyphae': createMemoirDetail({
      concepts: [createConcept({ definition: 'Persists memory data', id: 'concept-3', name: 'HyphaeStore' })],
      memoir: memoirs[1],
      total_concepts: 1,
    }),
  } as const

  return {
    useMemoir: vi.fn((name: string) => ({
      data: name ? details[name as keyof typeof details] : undefined,
      isLoading: false,
    })),
    useMemoirInspect: vi.fn((_memoir: string, concept: string) => ({
      data: concept
        ? createConceptInspection({
            concept: createConcept({ definition: `${concept} inspection`, id: 'inspect-1', name: concept }),
          })
        : undefined,
      isLoading: false,
    })),
    useMemoirs: vi.fn(() => ({
      data: memoirs,
      error: null,
      isLoading: false,
    })),
  }
})

vi.mock('./memoirs/MemoirInspectPanel', () => ({
  MemoirInspectPanel: ({
    graphDepth,
    history,
    inspectConcept,
    onBack,
    onChangeDepth,
  }: {
    graphDepth: string
    history: string[]
    inspectConcept: string
    onBack: () => void
    onChangeDepth: (value: string) => void
  }) => (
    <div>
      <div>Inspect concept: {inspectConcept || 'none'}</div>
      <div>Inspect depth: {graphDepth}</div>
      <div>Inspect history: {history.join(', ') || 'empty'}</div>
      <button
        onClick={() => onChangeDepth('4')}
        type='button'
      >
        Change inspect depth
      </button>
      <button
        onClick={onBack}
        type='button'
      >
        Back inspect history
      </button>
    </div>
  ),
}))

function LocationProbe() {
  const location = useLocation()
  return <div data-testid='location-search'>{location.search}</div>
}

describe('Memoirs page', () => {
  it('hydrates from the url and updates memoir state through page interactions', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <>
        <Memoirs />
        <LocationProbe />
      </>,
      { route: '/memoirs?memoir=code%3Acap&concept=getReadinessPanels&depth=3&filter=readiness&page=2' }
    )

    expect(screen.getByRole('heading', { name: 'Memoirs' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'code:cap' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('readiness')).toBeInTheDocument()
    expect(screen.getByText('Inspect concept: getReadinessPanels')).toBeInTheDocument()
    expect(screen.getByText('Inspect depth: 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /open memoir code:hyphae/i }))
    expect(screen.getByRole('heading', { name: 'code:hyphae' })).toBeInTheDocument()
    expect(screen.getByTestId('location-search').textContent).toContain('memoir=code%3Ahyphae')
    expect(screen.getByTestId('location-search').textContent).toContain('depth=3')
    expect(screen.getByTestId('location-search').textContent).not.toContain('concept=')
    expect(screen.getByTestId('location-search').textContent).not.toContain('filter=')
    expect(screen.getByTestId('location-search').textContent).not.toContain('page=')

    await user.click(screen.getByRole('row', { name: /inspect concept HyphaeStore/i }))
    expect(screen.getByText('Inspect concept: HyphaeStore')).toBeInTheDocument()
    expect(screen.getByTestId('location-search').textContent).toContain('concept=HyphaeStore')

    await user.click(screen.getByRole('button', { name: 'Change inspect depth' }))
    expect(screen.getByTestId('location-search').textContent).toContain('depth=4')
  })
})
