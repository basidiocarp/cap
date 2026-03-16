import { createTheme, rem } from '@mantine/core';

export const themeTokens = createTheme({
  other: {
    borderLight: 'var(--mantine-color-gray-2)',
    containerPadding: rem(24),
    hoverPrimary: '#E64D00',
    textPrimary: 'var(--mantine-color-gray-9)',
    textSecondary: 'var(--mantine-color-gray-6)',
  },
});
