import { Alert, Button, Group, Stack } from '@mantine/core'
import { Link } from 'react-router-dom'

import { canopyHref, sessionsHref } from '../../lib/routes'

export function AnalyticsHeader() {
  return (
    <Alert
      color='gray'
      title='Tool-scoped analytics'
    >
      <Stack gap='sm'>
        <div>
          Each tab reports one tool&apos;s own record stream. Empty Mycelium tabs usually mean Mycelium has no captured commands yet, not
          that Claude Code or Codex were inactive overall.
        </div>
        <Group gap='xs'>
          <Button
            component={Link}
            size='xs'
            to={canopyHref()}
            variant='light'
          >
            Open Canopy board
          </Button>
          <Button
            component={Link}
            size='xs'
            to={sessionsHref({ detail: 'latest' })}
            variant='subtle'
          >
            Open latest session
          </Button>
          <Button
            component={Link}
            size='xs'
            to={sessionsHref()}
            variant='subtle'
          >
            Open sessions timeline
          </Button>
        </Group>
      </Stack>
    </Alert>
  )
}
