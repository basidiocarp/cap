import type { MantineSize } from '@mantine/core'
import type { ReactNode } from 'react'
import { Text } from '@mantine/core'

export function EmptyState({ children, mt }: { children: ReactNode; mt?: MantineSize }) {
  return (
    <Text
      c='dimmed'
      mt={mt}
      size='sm'
    >
      {children}
    </Text>
  )
}
