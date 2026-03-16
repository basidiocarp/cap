import type { MantineThemeOverride } from '@mantine/core'
import { Card, mergeThemeOverrides } from '@mantine/core'

import { themeColors } from './colors'
import { themeComponentStyles } from './componentStyles'
import { themeInteractions } from './interactions'
import { themeShadows } from './shadows'
import { themeSpacing } from './spacing'
import { themeTokens } from './tokens'
import { themeTypography } from './typography'

const cardDefaults = {
  components: {
    Card: Card.extend({
      defaultProps: {
        padding: 'sm',
      },
    }),
  },
}

export const theme: MantineThemeOverride = mergeThemeOverrides(
  themeTypography,
  themeShadows,
  themeInteractions,
  themeColors,
  themeSpacing,
  themeTokens,
  themeComponentStyles,
  cardDefaults
)
