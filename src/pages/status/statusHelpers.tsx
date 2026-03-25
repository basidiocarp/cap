import { Badge } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck, IconCircleX } from '@tabler/icons-react'

export function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <Badge
      color={available ? 'mycelium' : 'decay'}
      leftSection={available ? <IconCircleCheck size={12} /> : <IconCircleX size={12} />}
      size='sm'
      variant='light'
    >
      {available ? 'Available' : 'Unavailable'}
    </Badge>
  )
}

export function HookSummaryIcon({ label }: { label: string }) {
  return ['Covered', 'Codex ready', 'Optional'].includes(label) ? <IconCircleCheck size={12} /> : <IconAlertCircle size={12} />
}
