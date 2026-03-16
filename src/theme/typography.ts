import { createTheme, rem } from '@mantine/core'

export const themeTypography = createTheme({
  fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: "'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSizes: {
    lg: rem(18),
    md: rem(16),
    sm: rem(14),
    xl: rem(20),
    xs: rem(12),
  },
  fontSmoothing: true,
  headings: {
    fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
    sizes: {
      h1: { fontSize: rem(32), fontWeight: '500', lineHeight: rem(40) },
      h2: { fontSize: rem(26), fontWeight: '500', lineHeight: rem(34) },
      h3: { fontSize: rem(22), fontWeight: '500', lineHeight: rem(30) },
      h4: { fontSize: rem(18), fontWeight: '500', lineHeight: rem(26) },
      h5: { fontSize: rem(16), fontWeight: '500', lineHeight: rem(24) },
      h6: { fontSize: rem(14), fontWeight: '500', lineHeight: rem(20) },
    },
  },
  lineHeights: {
    lg: rem(24),
    md: rem(24),
    sm: rem(20),
    xl: rem(28),
    xs: rem(18),
  },
})
