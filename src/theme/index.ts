import type { DefaultMantineColor, MantineColorsTuple } from '@mantine/core'
import { Button, Card, createTheme, mergeMantineTheme, rem, Text } from '@mantine/core'

// Underground network, growth — teal-green
const mycelium: MantineColorsTuple = [
  '#e6fcf5',
  '#c3fae8',
  '#96f2d7',
  '#63e6be',
  '#38d9a9',
  '#20c997',
  '#12b886',
  '#0ca678',
  '#099268',
  '#087f5b',
]

// Dispersal, potential — purple
const spore: MantineColorsTuple = [
  '#f3f0ff',
  '#e5dbff',
  '#d0bfff',
  '#b197fc',
  '#9775fa',
  '#845ef7',
  '#7950f2',
  '#7048e8',
  '#6741d9',
  '#5f3dc4',
]

// Growth medium, earth — warm amber
const substrate: MantineColorsTuple = [
  '#fff8e1',
  '#ffecb3',
  '#ffe082',
  '#ffd54f',
  '#ffca28',
  '#ffc107',
  '#ffb300',
  '#ffa000',
  '#ff8f00',
  '#ff6f00',
]

// Fungal cell walls — cool slate
const chitin: MantineColorsTuple = [
  '#f0f4f8',
  '#d9e2ec',
  '#bcccdc',
  '#9fb3c8',
  '#829ab1',
  '#627d98',
  '#486581',
  '#334e68',
  '#243b53',
  '#102a43',
]

// Underside lamellae — soft pink/salmon
const gill: MantineColorsTuple = [
  '#fff0f0',
  '#ffe0e0',
  '#ffc2c2',
  '#ffa0a0',
  '#ff7e7e',
  '#f76c6c',
  '#e85d5d',
  '#d44f4f',
  '#b94141',
  '#9c3535',
]

// Spore-bearing surface — gold/ochre
const hymenium: MantineColorsTuple = [
  '#fef9e7',
  '#fdf0c4',
  '#fbe59e',
  '#f8d776',
  '#f5c84e',
  '#f0b429',
  '#d9a021',
  '#bf8b1a',
  '#a27613',
  '#86620d',
]

// Visible mushroom body — warm orange
const fruiting: MantineColorsTuple = [
  '#fff3e0',
  '#ffe0b2',
  '#ffcc80',
  '#ffb74d',
  '#ffa726',
  '#ff9800',
  '#fb8c00',
  '#f57c00',
  '#ef6c00',
  '#e65100',
]

// Decomposition cycle — muted rust
const decay: MantineColorsTuple = [
  '#fbe9e7',
  '#f5cac3',
  '#e8a598',
  '#d9806e',
  '#c9604a',
  '#b7432f',
  '#a23622',
  '#8b2b19',
  '#732211',
  '#5c1a0b',
]

// Symbiosis — blue-green/cyan
const lichen: MantineColorsTuple = [
  '#e0f7fa',
  '#b2ebf2',
  '#80deea',
  '#4dd0e1',
  '#26c6da',
  '#00bcd4',
  '#00acc1',
  '#0097a7',
  '#00838f',
  '#006064',
]

export type ExtendedCustomColors =
  | DefaultMantineColor
  | 'chitin'
  | 'decay'
  | 'fruiting'
  | 'gill'
  | 'hymenium'
  | 'lichen'
  | 'mycelium'
  | 'spore'
  | 'substrate'

export const theme = createTheme({
  // Interactions
  activeClassName: 'mantine-active',

  // Colors
  autoContrast: true,

  // Spacing + radius
  breakpoints: {
    lg: '75em',
    md: '62em',
    sm: '48em',
    xl: '88em',
    xs: '36em',
  },
  colors: {
    chitin,
    decay,
    fruiting,
    gill,
    hymenium,
    lichen,
    mycelium,
    spore,
    substrate,
  },

  // Component defaults
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: 'sm',
      },
    }),
    Card: Card.extend({
      defaultProps: {
        padding: 'sm',
        radius: 'md',
      },
    }),
    Text: Text.extend({
      styles: (_theme, props) => {
        switch (props.variant) {
          case 'label':
            return {
              root: {
                color: 'var(--mantine-color-dimmed)',
                fontWeight: 500,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              },
            }
          case 'caption':
            return {
              root: {
                color: 'var(--mantine-color-dimmed)',
              },
            }
          case 'value':
            return {
              root: {
                fontWeight: 500,
              },
            }
          default:
            return {}
        }
      },
      vars: (_theme, props) => {
        switch (props.variant) {
          case 'label':
            return { root: { '--text-fz': rem(12), '--text-lh': rem(16) } }
          case 'caption':
            return { root: { '--text-fz': rem(12), '--text-lh': rem(16) } }
          case 'value':
            return { root: { '--text-fz': rem(20), '--text-lh': rem(28) } }
          default:
            return { root: {} }
        }
      },
    }),
  },
  cursorType: 'pointer',

  // Shadows + gradient
  defaultGradient: {
    deg: 135,
    from: 'mycelium',
    to: 'spore',
  },
  defaultRadius: 'sm',
  focusClassName: '',
  focusRing: 'auto',
  // Typography
  fontFamily: 'Inter Variable, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
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
    fontFamily: 'Inter Variable, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
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

  // Semantic shortcuts (JS-side access via useMantineTheme().other.*)
  other: {
    borderLight: 'var(--mantine-color-dark-4)',
    containerPadding: rem(24),
    textPrimary: 'var(--mantine-color-gray-1)',
    textSecondary: 'var(--mantine-color-gray-5)',
  },
  primaryColor: 'mycelium',
  primaryShade: {
    dark: 7,
    light: 6,
  },
  radius: {
    lg: 'calc(1rem * var(--mantine-scale))',
    md: 'calc(0.5rem * var(--mantine-scale))',
    sm: 'calc(0.25rem * var(--mantine-scale))',
    xl: 'calc(2rem * var(--mantine-scale))',
    xs: 'calc(0.125rem * var(--mantine-scale))',
  },
  respectReducedMotion: true,
  shadows: {
    lg: '0 1px 3px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.25)',
    md: '0 1px 3px rgba(0, 0, 0, 0.25), 0 4px 16px rgba(0, 0, 0, 0.2)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15)',
    xl: '0 1px 3px rgba(0, 0, 0, 0.35), 0 12px 32px rgba(0, 0, 0, 0.3)',
    xs: '0 1px 2px rgba(0, 0, 0, 0.15)',
  },
  spacing: {
    lg: 'calc(1.25rem * var(--mantine-scale))',
    md: 'calc(1rem * var(--mantine-scale))',
    sm: 'calc(0.75rem * var(--mantine-scale))',
    xl: 'calc(2rem * var(--mantine-scale))',
    xs: 'calc(0.625rem * var(--mantine-scale))',
  },
})

export function mergeThemeOverrides(baseTheme: ReturnType<typeof createTheme>, overrides: Record<string, unknown>) {
  // biome-ignore lint/suspicious/noExplicitAny: necessary for theme merging
  // biome-ignore lint/suspicious/noExplicitAny: necessary for theme merging
  return (mergeMantineTheme as any)(baseTheme, overrides) as ReturnType<typeof createTheme>
}
