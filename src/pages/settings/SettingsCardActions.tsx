import { Button, Group } from '@mantine/core'
import { Link } from 'react-router-dom'

export function SettingsCardActions({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  primaryHref: string
  primaryLabel: string
  secondaryHref: string
  secondaryLabel: string
}) {
  return (
    <Group gap='xs'>
      <Button
        component={Link}
        size='xs'
        to={primaryHref}
        variant='light'
      >
        {primaryLabel}
      </Button>
      <Button
        component={Link}
        size='xs'
        to={secondaryHref}
        variant='subtle'
      >
        {secondaryLabel}
      </Button>
    </Group>
  )
}
