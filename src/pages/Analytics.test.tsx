import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../test/render'
import { Analytics } from './Analytics'

vi.mock('../lib/queries', () => ({
  useCommandHistory: () => ({ data: { commands: [], total: 0 } }),
  useEcosystemStatus: () => ({ data: null }),
  useHyphaeAnalytics: () => ({ data: null, isLoading: false }),
  useMyceliumAnalytics: () => ({ data: null, isLoading: false }),
  useRhizomeAnalytics: () => ({ data: null, isLoading: false }),
  useTelemetry: () => ({ data: null }),
  useUsageAggregate: () => ({ data: null }),
  useUsageSessions: () => ({ data: null }),
  useUsageTrend: () => ({ data: null }),
}))

describe('Analytics page', () => {
  it('links into the latest session drilldown and the full sessions timeline', () => {
    renderWithProviders(<Analytics />, { route: '/analytics' })

    expect(screen.getByRole('link', { name: 'Open latest session' })).toHaveAttribute('href', '/sessions?detail=latest')
    expect(screen.getByRole('link', { name: 'Open sessions timeline' })).toHaveAttribute('href', '/sessions')
  })
})
