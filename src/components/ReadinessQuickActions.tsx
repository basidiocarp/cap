import { Button, Group } from '@mantine/core'
import { IconPlayerPlay, IconRefresh } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import type { ReadinessQuickAction } from '../lib/readiness'

type RunAction = NonNullable<ReadinessQuickAction['runAction']>

interface ReadinessQuickActionsProps {
  actionIsRunning?: (actionKey?: RunAction) => boolean
  actions: ReadinessQuickAction[]
  onRefresh?: () => void
  onRun?: (actionKey: RunAction) => void
}

export function ReadinessQuickActions({ actionIsRunning, actions, onRefresh, onRun }: ReadinessQuickActionsProps) {
  return (
    <Group gap='xs'>
      {actions.map((action) => {
        if (action.kind === 'link' && action.href) {
          return (
            <Button
              component={Link}
              key={`${action.kind}-${action.label}-${action.href}`}
              size='xs'
              to={action.href}
              variant={action.variant ?? 'subtle'}
            >
              {action.label}
            </Button>
          )
        }

        if (action.kind === 'refresh') {
          return (
            <Button
              key={`${action.kind}-${action.label}`}
              leftSection={<IconRefresh size={14} />}
              onClick={onRefresh}
              size='xs'
              variant={action.variant ?? 'subtle'}
            >
              {action.label}
            </Button>
          )
        }

        if (action.kind === 'run' && action.runAction) {
          const runAction = action.runAction
          const running = actionIsRunning?.(runAction)
          return (
            <Button
              disabled={running}
              key={`${action.kind}-${action.label}-${runAction}`}
              leftSection={<IconPlayerPlay size={14} />}
              onClick={() => onRun?.(runAction)}
              size='xs'
              variant={action.variant ?? 'light'}
            >
              {running ? 'Running...' : action.label}
            </Button>
          )
        }

        return null
      })}
    </Group>
  )
}
