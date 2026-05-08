import { createTheme, rem } from '@mantine/core'

// Semantic CSS variables are defined in src/styles/tokens.css
// Mantine `other` tokens here are for JS-side theme access (e.g. useMantineTheme().other.textPrimary)
export const themeTokens = createTheme({
  other: {
    borderLight: 'var(--mantine-color-dark-4)',
    containerPadding: rem(24),
    textPrimary: 'var(--mantine-color-gray-1)',
    textSecondary: 'var(--mantine-color-gray-5)',
  },
})
