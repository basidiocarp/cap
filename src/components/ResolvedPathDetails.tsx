import { Badge, Code, Group, Stack, Text } from '@mantine/core'

export function ResolvedPathDetails({ label, note, path, present }: { label: string; note?: string; path: string; present: boolean }) {
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
          color={present ? 'mycelium' : 'gray'}
          size='xs'
          variant={present ? 'light' : 'outline'}
        >
          {present ? 'Detected' : 'Resolved default'}
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
