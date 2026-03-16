import type { MantineSize } from '@mantine/core'
import { Group, Loader } from '@mantine/core'

export function PageLoader({ mt = 'xl', size }: { mt?: MantineSize; size?: MantineSize }) {
  return (
    <Group
      justify='center'
      mt={mt}
    >
      <Loader size={size} />
    </Group>
  )
}
