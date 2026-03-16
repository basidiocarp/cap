import { Button, createTheme } from '@mantine/core'

export const buttonStyles = createTheme({
  components: {
    Button: Button.extend({
      defaultProps: {
        radius: 'sm',
      },
    }),
  },
})
