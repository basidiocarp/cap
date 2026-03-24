import { Badge, Button, Card, CopyButton, Group, Stack, Text } from '@mantine/core'
import { IconCopy, IconPlayerPlay } from '@tabler/icons-react'

export function CommandCard({
  command,
  description,
  label,
  onRun,
  recentlyRan = false,
  running = false,
  tier,
}: {
  command: string
  description: string
  label: string
  onRun?: () => void
  recentlyRan?: boolean
  running?: boolean
  tier: 'manual' | 'primary' | 'secondary'
}) {
  return (
    <Card
      bg='var(--mantine-color-gray-0)'
      p='md'
      withBorder
    >
      <Stack gap='xs'>
        <Group justify='space-between'>
          <div>
            <Group gap='xs'>
              <Text fw={600}>{label}</Text>
              {recentlyRan && (
                <Badge
                  color='green'
                  size='xs'
                  variant='light'
                >
                  last run
                </Badge>
              )}
              <Badge
                color={tier === 'primary' ? 'mycelium' : tier === 'secondary' ? 'substrate' : 'gray'}
                size='xs'
                variant='light'
              >
                {tier}
              </Badge>
            </Group>
            <Text
              c='dimmed'
              size='sm'
            >
              {description}
            </Text>
          </div>

          {onRun && (
            <Button
              disabled={running}
              leftSection={<IconPlayerPlay size={14} />}
              onClick={onRun}
              size='xs'
              variant='light'
            >
              {running ? 'Running...' : 'Run via Stipe'}
            </Button>
          )}
        </Group>

        <Group justify='space-between'>
          <Text
            ff='monospace'
            size='sm'
          >
            {command}
          </Text>
          <CopyButton value={command}>
            {({ copied, copy }) => (
              <Button
                leftSection={<IconCopy size={14} />}
                onClick={copy}
                size='xs'
                variant='subtle'
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </CopyButton>
        </Group>
      </Stack>
    </Card>
  )
}
