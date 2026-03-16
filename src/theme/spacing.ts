import { createTheme } from '@mantine/core';

export const themeSpacing = createTheme({
  breakpoints: {
    lg: '75em',
    md: '62em',
    sm: '48em',
    xl: '88em',
    xs: '36em',
  },
  defaultRadius: 'sm',
  radius: {
    lg: 'calc(1rem * var(--mantine-scale))',
    md: 'calc(0.5rem * var(--mantine-scale))',
    sm: 'calc(0.25rem * var(--mantine-scale))',
    xl: 'calc(2rem * var(--mantine-scale))',
    xs: 'calc(0.125rem * var(--mantine-scale))',
  },
  spacing: {
    lg: 'calc(1.25rem * var(--mantine-scale))',
    md: 'calc(1rem * var(--mantine-scale))',
    sm: 'calc(0.75rem * var(--mantine-scale))',
    xl: 'calc(2rem * var(--mantine-scale))',
    xs: 'calc(0.625rem * var(--mantine-scale))',
  },
});
