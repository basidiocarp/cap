import { createTheme, rem, Text } from '@mantine/core';

export const textStyles = createTheme({
  components: {
    Text: Text.extend({
      styles: (_theme, props) => {
        switch (props.variant) {
          case 'label':
            return {
              root: {
                color: 'var(--mantine-color-gray-6)',
                fontWeight: 500,
                letterSpacing: '0.96px',
                textTransform: 'uppercase',
              },
            };
          case 'caption':
            return {
              root: {
                color: 'var(--mantine-color-gray-6)',
              },
            };
          case 'value':
            return {
              root: {
                color: 'var(--mantine-color-gray-9)',
                fontWeight: 500,
              },
            };
          case 'body-lg':
            return {
              root: {
                color: 'var(--mantine-color-gray-9)',
              },
            };
          default:
            return {};
        }
      },
      vars: (_theme, props) => {
        switch (props.variant) {
          case 'label':
            return {
              root: {
                '--text-fz': rem(14),
                '--text-lh': rem(18),
              },
            };
          case 'caption':
            return {
              root: {
                '--text-fz': rem(12),
                '--text-lh': rem(16),
              },
            };
          case 'value':
            return {
              root: {
                '--text-fz': rem(20),
                '--text-lh': rem(28),
              },
            };
          case 'body-lg':
            return {
              root: {
                '--text-fz': rem(16),
                '--text-lh': rem(24),
              },
            };
          default:
            return { root: {} };
        }
      },
    }),
  },
});
