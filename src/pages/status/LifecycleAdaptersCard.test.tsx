import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createEcosystemStatus } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { LifecycleAdaptersCard } from './LifecycleAdaptersCard'

describe('LifecycleAdaptersCard', () => {
  it('does not emit duplicate key warnings for repeated lifecycle events', () => {
    const status = createEcosystemStatus({
      hooks: {
        error_count: 0,
        installed_hooks: [
          { command: 'hyphae hook', event: 'PostToolUse', matcher: '*' },
        ],
        lifecycle: [
          { event: 'PostToolUse', installed: true, matching_hooks: 1 },
          { event: 'PostToolUse', installed: false, matching_hooks: 2 },
          { event: 'SessionEnd', installed: true, matching_hooks: 1 },
        ],
        recent_errors: [],
      },
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      renderWithProviders(<LifecycleAdaptersCard status={status} />)

      expect(screen.getByText('SessionEnd')).toBeInTheDocument()
      expect(
        consoleError.mock.calls.flat().some((value) =>
          typeof value === 'string' && value.includes('Encountered two children with the same key'),
        ),
      ).toBe(false)
    } finally {
      consoleError.mockRestore()
    }
  })
})
