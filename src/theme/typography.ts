import { createTheme, rem } from '@mantine/core';

export const themeTypography = createTheme({
  fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
  fontSizes: {
    lg: rem(18),
    md: rem(16),
    sm: rem(14),
    xl: rem(20),
    xs: rem(12),
  },
  fontSmoothing: true,
  headings: {
    fontFamily: 'Zodiak, Georgia, Times New Roman, serif',
    sizes: {
      h1: {
        fontSize: `clamp(${rem(35)}, 5vw, ${rem(40)})`,
        fontWeight: '400',
        lineHeight: `clamp(${rem(40)}, 5.5vw, ${rem(45)})`,
      },
      h2: {
        fontSize: `clamp(${rem(25)}, 4vw, ${rem(30)})`,
        fontWeight: '400',
        lineHeight: `clamp(${rem(30)}, 4.5vw, ${rem(35)})`,
      },
      h3: {
        fontSize: `clamp(${rem(22)}, 3.5vw, ${rem(28)})`,
        fontWeight: '400',
        lineHeight: `clamp(${rem(27)}, 4vw, ${rem(33)})`,
      },
      h4: {
        fontSize: `clamp(${rem(18)}, 2.5vw, ${rem(20)})`,
        fontWeight: '400',
        lineHeight: `clamp(${rem(23)}, 3vw, ${rem(28)})`,
      },
      h5: {
        fontSize: `clamp(${rem(18)}, 2.5vw, ${rem(20)})`,
        fontWeight: '400',
        lineHeight: `clamp(${rem(23)}, 3.5vw, ${rem(32)})`,
      },
      h6: {
        fontSize: `clamp(${rem(18)}, 2.5vw, ${rem(20)})`,
        fontWeight: '400',
        lineHeight: `clamp(${rem(23)}, 3vw, ${rem(28)})`,
      },
    },
  },
  lineHeights: {
    lg: rem(24),
    md: rem(24),
    sm: rem(20),
    xl: rem(28),
    xs: rem(18),
  },
});
