import { createTheme, rem, Text } from '@mantine/core'

export const textStyles = createTheme({
  components: {
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
})
