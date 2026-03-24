import { Badge, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

import type { StipeDoctorCheck } from '../../lib/api'

export function IssueCard({ check }: { check: StipeDoctorCheck }) {
  return (
    <Card
      bg='var(--mantine-color-gray-0)'
      p='md'
      withBorder
    >
      <Stack gap='xs'>
        <Group gap='xs'>
          <ThemeIcon
            color='orange'
            size='sm'
            variant='light'
          >
            <IconAlertCircle size={14} />
          </ThemeIcon>
          <Text fw={600}>{check.name}</Text>
        </Group>
        <Text size='sm'>{check.message}</Text>
        {!!check.repair_actions?.length && (
          <Group gap='xs'>
            {check.repair_actions.map((action) => (
              <Badge
                color='orange'
                key={`${check.name}-${action.command}`}
                size='sm'
                variant='light'
              >
                {action.command}
              </Badge>
            ))}
          </Group>
        )}
      </Stack>
    </Card>
  )
}
