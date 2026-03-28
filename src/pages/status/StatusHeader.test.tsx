import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../test/render'
import { StatusHeader } from './StatusHeader'

describe('StatusHeader', () => {
  it('links into the Canopy board and latest session drilldown', () => {
    renderWithProviders(<StatusHeader onRefresh={vi.fn()} />, { route: '/status' })

    expect(screen.getByRole('link', { name: 'Canopy board' })).toHaveAttribute('href', '/canopy')
    expect(screen.getByRole('link', { name: 'Latest session' })).toHaveAttribute('href', '/sessions?detail=latest')
  })
})
