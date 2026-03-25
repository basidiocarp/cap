import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createConcept, createMemoirDetail } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { MemoirConceptsPanel } from './MemoirConceptsPanel'

describe('MemoirConceptsPanel', () => {
  it('renders concept rows and forwards filter, page, and inspect interactions', async () => {
    const user = userEvent.setup()
    const onChangeFilter = vi.fn()
    const onChangePage = vi.fn()
    const onInspect = vi.fn()
    const detail = createMemoirDetail({
      concepts: [
        createConcept(),
        createConcept({
          confidence: 0.81,
          definition: 'Renders host coverage controls',
          id: 'concept-2',
          name: 'HostCoveragePanel',
        }),
      ],
      total_concepts: 450,
    })

    function PanelHarness() {
      const [conceptFilter, setConceptFilter] = useState('')
      const [conceptPage, setConceptPage] = useState(2)

      return (
        <MemoirConceptsPanel
          conceptFilter={conceptFilter}
          conceptPage={conceptPage}
          currentRangeEnd={400}
          currentRangeStart={201}
          detail={detail}
          inspectConcept='HostCoveragePanel'
          onChangeFilter={(value) => {
            setConceptFilter(value)
            onChangeFilter(value)
          }}
          onChangePage={(page) => {
            setConceptPage(page)
            onChangePage(page)
          }}
          onInspect={onInspect}
          pageSize={200}
          totalPages={3}
        />
      )
    }

    renderWithProviders(<PanelHarness />)

    expect(screen.getByText('201-400 of 450')).toBeInTheDocument()
    expect(screen.getByText(/Large memoirs are loaded in pages of 200 concepts/i)).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /inspect concept HostCoveragePanel/i })).toHaveAttribute('aria-current', 'true')

    await user.type(screen.getByRole('textbox', { name: /filter concepts by name or definition/i }), 'host')
    expect(onChangeFilter).toHaveBeenLastCalledWith('host')

    await user.click(screen.getByRole('button', { name: '3' }))
    expect(onChangePage).toHaveBeenCalledWith(3)

    await user.click(screen.getByRole('row', { name: /inspect concept getReadinessPanels/i }))
    expect(onInspect).toHaveBeenCalledWith('getReadinessPanels')
  })

  it('shows filtered and empty memoir states', () => {
    const { rerender } = renderWithProviders(
      <MemoirConceptsPanel
        conceptFilter='missing'
        conceptPage={1}
        currentRangeEnd={0}
        currentRangeStart={0}
        detail={createMemoirDetail({ concepts: [], total_concepts: 0 })}
        inspectConcept=''
        onChangeFilter={vi.fn()}
        onChangePage={vi.fn()}
        onInspect={vi.fn()}
        pageSize={200}
        totalPages={1}
      />
    )

    expect(screen.getByText('No concepts match the filter')).toBeInTheDocument()

    rerender(
      <MemoirConceptsPanel
        conceptFilter=''
        conceptPage={1}
        currentRangeEnd={0}
        currentRangeStart={0}
        detail={createMemoirDetail({ concepts: [], total_concepts: 0 })}
        inspectConcept=''
        onChangeFilter={vi.fn()}
        onChangePage={vi.fn()}
        onInspect={vi.fn()}
        pageSize={200}
        totalPages={1}
      />
    )

    expect(screen.getByText('No concepts in this memoir yet')).toBeInTheDocument()
  })
})
