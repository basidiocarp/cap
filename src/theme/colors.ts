import type { DefaultMantineColor, MantineColorsTuple } from '@mantine/core'
import { createTheme } from '@mantine/core'

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

export const themeColors = createTheme({
  autoContrast: true,
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
  defaultRadius: 'sm',
  primaryColor: 'mycelium',
  primaryShade: {
    dark: 7,
    light: 6,
  },
})
