import { Badge, Code, Group, Stack, Text } from '@mantine/core'

type PathSource = 'config_file' | 'env_override' | 'platform_default'

function getSourceBadge(source: PathSource): { color: string; label: string; variant: 'light' | 'outline' } {
  switch (source) {
    case 'config_file':
      return { color: 'mycelium', label: 'Config file', variant: 'light' }
    case 'env_override':
      return { color: 'orange', label: 'Env override', variant: 'light' }
    default:
      return { color: 'gray', label: 'Platform default', variant: 'outline' }
  }
}

export function ResolvedPathDetails({ label, note, path, source }: { label: string; note?: string; path: string; source: PathSource }) {
  const badge = getSourceBadge(source)

  return (
    <Stack gap={4}>
      <Group gap='xs'>
        <Text
          c='dimmed'
          size='sm'
        >
          {label}
        </Text>
        <Badge
          color={badge.color}
          size='xs'
          variant={badge.variant}
        >
          {badge.label}
        </Badge>
      </Group>
      <Code block>{path}</Code>
      {note ? (
        <Text
          c='dimmed'
          size='xs'
        >
          {note}
        </Text>
      ) : null}
    </Stack>
  )
}
