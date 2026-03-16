import { createTheme } from '@mantine/core'

export const themeShadows = createTheme({
  defaultGradient: {
    deg: 135,
    from: 'mycelium',
    to: 'spore',
  },
  shadows: {
    lg: '0 1px 3px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.25)',
    md: '0 1px 3px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.2)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15)',
    xl: '0 1px 3px rgba(0, 0, 0, 0.35), 0 12px 32px rgba(0, 0, 0, 0.3)',
    xs: '0 1px 2px rgba(0, 0, 0, 0.15)',
  },
})
