import type { MantineSize } from '@mantine/core'
import type { ReactNode } from 'react'
import { Card, Group, Stack, Text, Title } from '@mantine/core'

interface ActionEmptyStateProps {
  actions?: ReactNode
  description: ReactNode
  hint?: ReactNode
  mt?: MantineSize
  title: ReactNode
}

export function ActionEmptyState({ actions, description, hint, mt, title }: ActionEmptyStateProps) {
  return (
    <Card
      bg='var(--mantine-color-gray-0)'
      mt={mt}
      p='md'
      withBorder
    >
      <Stack gap='xs'>
        <Title order={4}>{title}</Title>
        <Text size='sm'>{description}</Text>
        {hint && (
          <Text
            c='dimmed'
            size='sm'
          >
            {hint}
          </Text>
        )}
        {actions && <Group gap='xs'>{actions}</Group>}
      </Stack>
    </Card>
  )
}
