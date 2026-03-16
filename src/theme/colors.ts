import type { DefaultMantineColor } from '@mantine/core';

import { createTheme } from '@mantine/core';

export type ExtendedCustomColors =
  | 'primaryColorName'
  | 'secondaryColorName'
  | 'gold'
  | 'cream'
  | 'orange'
  | 'sinopia'
  | 'mango'
  | 'navy'
  | 'maroon'
  | 'olive'
  | 'blue'
  | 'green'
  | 'sand'
  | 'gray'
  | 'error'
  | DefaultMantineColor;

export const themeColors = createTheme({
  autoContrast: false,
  black: '#000',
  colors: {
    blue: [
      '#E6F3FA',
      '#B0DAEF',
      '#8AC8E8',
      '#54AFDD',
      '#339FD6',
      '#0087CC', // Base Color
      '#007BBA',
      '#006091',
      '#004A70',
      '#003956',
    ],
    cream: [
      '#FFFFFC',
      '#FEFDF6',
      '#FDFDF2',
      '#FCFCEC',
      '#FCFBE9',
      '#FBFAE3', // Base Color
      '#E4E4CF',
      '#B2B2A1',
      '#8A8A7D',
      '#69695F',
    ],
    error: [
      '#F8E8E8',
      '#EAB8B8',
      '#DF9696',
      '#D16666',
      '#C84949',
      '#BA1B1B', // Base Color
      '#A91919',
      '#841313',
      '#660F0F',
      '#4E0B0B',
    ],
    gold: [
      '#FFFAEB',
      '#FFEFC0',
      '#FFE8A1',
      '#FFDD76',
      '#FFD65C',
      '#FFCC33', // Base Color
      '#E8BA2E',
      '#B59124',
      '#8C701C',
      '#6B5615',
    ],
    gray: [
      '#F9F9F9',
      '#EEEEEE',
      '#CACACA',
      '#B1B1B1',
      '#8D8D8D',
      '#777777', // Base Color
      '#555555',
      '#4D4D4D',
      '#3C3C3C',
      '#2F2F2F',
    ],
    green: [
      '#E6F1E6',
      '#B0D3B2',
      '#8ABE8C',
      '#54A158',
      '#338E37',
      '#007205', // Base Color
      '#006805',
      '#005104',
      '#003F03',
      '#003002',
    ],
    maroon: [
      '#F0E9E6',
      '#D0BAB0',
      '#B9998A',
      '#986B54',
      '#854E33',
      '#662200', // Base Color
      '#5D1F00',
      '#481800',
      '#381300',
      '#2B0E00',
    ],
    navy: [
      '#E8EAEC',
      '#B7BDC4',
      '#949DA8',
      '#637080',
      '#455467',
      '#162941', // Base Color
      '#14253B',
      '#101D2E',
      '#0C1724',
      '#09111B',
    ],
    olive: [
      '#F4F1EA',
      '#DCD3BF',
      '#CBBD9F',
      '#B39F74',
      '#A48D59',
      '#8D702F', // Base Color
      '#80662B',
      '#645021',
      '#4E3E1A',
      '#3B2F14',
    ],
    orange: [
      '#FCF4F0',
      '#F5DCD0',
      '#F1CBB9',
      '#EAB498',
      '#E6A585',
      '#E08F66', // Base Color
      '#CC825D',
      '#9F6648',
      '#7B4F38',
      '#5E3C2B',
    ],
    sand: [
      '#FDFDFC',
      '#F8F7F5',
      '#F4F4F0',
      '#F0EEEA',
      '#EDEBE5',
      '#E8E6DF', // Base Color
      '#D3D1CB',
      '#A5A39E',
      '#807F7B',
      '#61615E',
    ],
    sinopia: [
      '#FAECE6',
      '#EFC5B0',
      '#E8A98A',
      '#DD8254',
      '#D66933',
      '#CC4400', // Base Color
      '#BA3E00',
      '#913000',
      '#702500',
      '#561D00',
    ],
  },
  defaultRadius: 'sm',
  luminanceThreshold: 0.3,
  primaryColor: 'sinopia',
  primaryShade: {
    dark: 8,
    light: 5,
  },
  white: '#fff',
});
