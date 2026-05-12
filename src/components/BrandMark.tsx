import { ThemeIcon } from '@mantine/core'
import { IconMushroom } from '@tabler/icons-react'

export function BrandMark() {
  return (
    <ThemeIcon
      gradient={{ deg: 135, from: 'mycelium', to: 'spore' }}
      radius='md'
      size={36}
      variant='gradient'
    >
      <IconMushroom size={20} />
    </ThemeIcon>
  )
}
