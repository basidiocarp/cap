import { createTheme, rem } from '@mantine/core'

export const themeTokens = createTheme({
  other: {
    borderLight: 'var(--mantine-color-dark-4)',
    containerPadding: rem(24),
    textPrimary: 'var(--mantine-color-gray-1)',
    textSecondary: 'var(--mantine-color-gray-5)',
  },
})
