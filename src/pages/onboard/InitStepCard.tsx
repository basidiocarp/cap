import { Badge, Card, Group, Stack, Text } from '@mantine/core'

import type { StipeInitStep } from '../../lib/api'

export function InitStepCard({ step }: { step: StipeInitStep }) {
  const color = step.status === 'planned' ? 'mycelium' : step.status === 'already-ok' ? 'green' : 'gray'

  return (
    <Card
      bg='var(--mantine-color-gray-0)'
      p='md'
      withBorder
    >
      <Stack gap='xs'>
        <Group gap='xs'>
          <Badge
            color={color}
            size='xs'
            variant='light'
          >
            {step.status}
          </Badge>
          <Text fw={600}>{step.title}</Text>
        </Group>
        <Text
          c='dimmed'
          size='sm'
        >
          {step.detail}
        </Text>
      </Stack>
    </Card>
  )
}
