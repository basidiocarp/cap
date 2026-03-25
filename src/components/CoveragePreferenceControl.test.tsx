import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CoveragePreferenceControl } from './CoveragePreferenceControl'

describe('CoveragePreferenceControl', () => {
  it('calls onChange when a different coverage mode is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <MantineProvider>
        <CoveragePreferenceControl
          onChange={onChange}
          value='auto'
        />
      </MantineProvider>
    )

    await user.click(screen.getByRole('radio', { name: 'Claude focus' }))

    expect(onChange).toHaveBeenCalledWith('claude')
  })
})
