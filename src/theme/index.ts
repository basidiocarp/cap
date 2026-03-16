import type { MantineThemeOverride } from '@mantine/core';

import { Card, mergeThemeOverrides } from '@mantine/core';

import { themeColors } from './colors';
import { themeComponentStyles } from './componentStyles';
import { themeInteractions } from './interactions';
import { themeShadows } from './shadows';
import { themeSpacing } from './spacing';
import { themeTokens } from './tokens';
import { themeTypography } from './typography';

const cardDefaults = {
  components: {
    Card: Card.extend({
      defaultProps: {
        padding: 'sm',
      },
    }),
  },
};

/**
 * Unified theme with responsive typography built-in.
 * Uses CSS clamp() for fluid heading sizes.
 *
 * Merge order (later overrides earlier):
 * 1. themeTypography - Font families, line heights, heading sizes
 * 2. themeShadows - Box shadows and gradients
 * 3. themeInteractions - Focus rings, cursor, reduced motion
 * 4. themeColors - Color palettes and primary color
 * 5. themeSpacing - Spacing scale, breakpoints, radius
 * 6. themeTokens - Design tokens (other.* values)
 * 7. themeComponentStyles - Component-specific styles (Button, Text)
 * 8. cardDefaults - Card component defaults
 */
export const theme: MantineThemeOverride = mergeThemeOverrides(
  themeTypography,
  themeShadows,
  themeInteractions,
  themeColors,
  themeSpacing,
  themeTokens,
  themeComponentStyles,
  cardDefaults,
);

export { themeColors, themeColors as colors } from './colors';
