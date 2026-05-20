import { Badge, Group, Paper, Stack, Text } from '@mantine/core'

import type { NodeRunStatus } from '../lib/types/workflows'

interface WorkflowNodeCardProps {
  nodeId: string
  kind: string
  status?: NodeRunStatus
}

function getKindColor(kind: string): string {
  const colors: Record<string, string> = {
    approval: 'orange',
    bash: 'cyan',
    command: 'violet',
    prompt: 'blue',
  }
  return colors[kind] || 'gray'
}

function getStatusColor(status?: string): string {
  const colors: Record<string, string> = {
    failed: 'red',
    pending: 'gray',
    running: 'blue',
    skipped: 'gray',
    success: 'green',
  }
  return colors[status || 'pending'] || 'gray'
}

export function WorkflowNodeCard({ nodeId, kind, status }: WorkflowNodeCardProps) {
  const outputLines = status?.output_preview
    ? status.output_preview
        .split('\n')
        .slice(0, 2)
        .filter((line) => line.trim())
    : []

  return (
    <Paper
      p='sm'
      radius='md'
      style={{
        borderLeft: `3px solid var(--mantine-color-${getStatusColor(status?.status)}-6)`,
      }}
      withBorder
    >
      <Stack gap='xs'>
        <Group justify='space-between'>
          <Text
            fw={600}
            size='sm'
          >
            {nodeId}
          </Text>
          {status && (
            <Badge
              color={getStatusColor(status.status)}
              size='xs'
              variant='light'
            >
              {status.status}
            </Badge>
          )}
        </Group>

        <Group gap='xs'>
          <Badge
            color={getKindColor(kind)}
            size='xs'
            variant='filled'
          >
            {kind}
          </Badge>
        </Group>

        {outputLines.length > 0 && (
          <Stack gap={0}>
            {outputLines.map((line) => (
              <Text
                c='dimmed'
                key={line}
                size='xs'
                style={{
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {line}
              </Text>
            ))}
          </Stack>
        )}

        {status?.started_at && (
          <Text
            c='dimmed'
            size='xs'
          >
            Started: {new Date(status.started_at).toLocaleTimeString()}
          </Text>
        )}
      </Stack>
    </Paper>
  )
}
