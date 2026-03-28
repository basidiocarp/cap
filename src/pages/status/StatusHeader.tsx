import { Button, Group, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { canopyHref, sessionsHref } from '../../lib/routes'

export interface StatusHeaderProps {
  onRefresh: () => void
}

export function StatusHeader({ onRefresh }: StatusHeaderProps) {
  return (
    <Group justify='space-between'>
      <div>
        <Title order={2}>Ecosystem Status</Title>
        <Text
          c='dimmed'
          size='sm'
        >
          Check what is installed, then jump to onboarding for the exact fix commands.
        </Text>
      </div>
      <Group>
        <Button
          component={Link}
          size='sm'
          to={canopyHref()}
          variant='light'
        >
          Canopy board
        </Button>
        <Button
          component={Link}
          leftSection={<IconAlertCircle size={16} />}
          to='/onboard'
          variant='light'
        >
          Onboarding
        </Button>
        <Button
          component={Link}
          size='sm'
          to={sessionsHref({ detail: 'latest' })}
          variant='subtle'
        >
          Latest session
        </Button>
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={onRefresh}
          size='sm'
          variant='subtle'
        >
          Refresh
        </Button>
      </Group>
    </Group>
  )
}
