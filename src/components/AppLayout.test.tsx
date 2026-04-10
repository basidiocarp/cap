import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../test/render'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('lets keyboard users toggle the mobile nav with a real button', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route
          element={<AppLayout />}
          path='/'
        >
          <Route
            element={<div>Home</div>}
            index
          />
        </Route>
      </Routes>,
      { route: '/' }
    )

    const toggleButton = screen.getByRole('button', { name: 'Toggle mobile navigation' })
    const controlsId = toggleButton.getAttribute('aria-controls')

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    expect(controlsId).toBeTruthy()
    expect(document.getElementById(controlsId ?? '')).toBeTruthy()

    await user.tab()
    expect(toggleButton).toHaveFocus()

    await user.keyboard('[Space]')
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('[Enter]')
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
  })
})
