import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createConceptInspection } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { MemoirInspectPanel } from './MemoirInspectPanel'

vi.mock('../../components/ConceptGraph', () => ({
  ConceptGraph: ({
    inspection,
    isLoading,
    onNodeClick,
  }: {
    inspection?: { concept: { name: string } }
    isLoading: boolean
    onNodeClick: (conceptName: string) => void
  }) => (
    <div>
      <div>{isLoading ? 'Graph loading' : `Graph for ${inspection?.concept.name ?? 'none'}`}</div>
      <button
        onClick={() => onNodeClick('HostCoveragePanel')}
        type='button'
      >
        Inspect graph node
      </button>
    </div>
  ),
}))

describe('MemoirInspectPanel', () => {
  it('renders inspect controls and forwards back, depth, and neighbor actions', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const onChangeDepth = vi.fn()
    const onInspect = vi.fn()
    const inspection = createConceptInspection()

    renderWithProviders(
      <MemoirInspectPanel
        graphDepth='2'
        history={['HostCoveragePanel']}
        inspectConcept='getReadinessPanels'
        inspection={inspection}
        inspectLoading={false}
        onBack={onBack}
        onChangeDepth={onChangeDepth}
        onInspect={onInspect}
        panelRef={createRef<HTMLDivElement>()}
      />
    )

    expect(screen.getByLabelText('Concept graph')).toBeInTheDocument()
    expect(await screen.findByText('Graph for getReadinessPanels')).toBeInTheDocument()
    expect(screen.getByText(/Confidence: 92% \| Revision: 3/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /back to HostCoveragePanel/i }))
    expect(onBack).toHaveBeenCalled()

    await user.click(screen.getByRole('radio', { name: '4' }))
    expect(onChangeDepth).toHaveBeenCalledWith('4')

    await user.click(screen.getByRole('row', { name: /inspect neighbor HostCoveragePanel/i }))
    expect(onInspect).toHaveBeenCalledWith('HostCoveragePanel')

    await user.click(screen.getByRole('button', { name: 'Inspect graph node' }))
    expect(onInspect).toHaveBeenCalledWith('HostCoveragePanel')
  })

  it('renders nothing when no inspect concept is selected', () => {
    renderWithProviders(
      <MemoirInspectPanel
        graphDepth='2'
        history={[]}
        inspectConcept=''
        inspection={createConceptInspection()}
        inspectLoading={false}
        onBack={vi.fn()}
        onChangeDepth={vi.fn()}
        onInspect={vi.fn()}
        panelRef={createRef<HTMLDivElement>()}
      />
    )

    expect(screen.queryByLabelText('Concept graph')).not.toBeInTheDocument()
  })
})
