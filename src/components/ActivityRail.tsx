import { Anchor, Badge, Box, Group, Stack, Text } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

interface ActivityEvent {
  id: string
  ts: number // unix ms
  kind: 'memory' | 'code' | 'lifecycle' | 'system'
  tool: string
  msg: string
}

const KIND_COLORS: Record<ActivityEvent['kind'], string> = {
  memory: 'mycelium',
  code: 'spore',
  lifecycle: 'substrate',
  system: 'chitin',
}

function getRelativeTime(ts: number): string {
  const now = Date.now()
  const diff = now - ts
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(ts).toLocaleDateString()
}

export function ActivityRail() {
  const [eventCount, setEventCount] = useState(0)

  const { data: events = [] } = useQuery({
    queryKey: ['activity-recent'],
    queryFn: async () => {
      const res = await fetch('/api/telemetry/activity/recent')
      if (!res.ok) throw new Error('Failed to fetch activity')
      return res.json() as Promise<ActivityEvent[]>
    },
    refetchInterval: 15_000,
  })

  useEffect(() => {
    setEventCount(events.length)
  }, [events])

  return (
    <Stack
      gap={0}
      h='100%'
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <Box p='md' style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
        <Group justify='space-between' mb='xs'>
          <Text fw={600} size='sm'>
            Live Activity
          </Text>
          <Badge color='mycelium' variant='dot' size='xs'>
            streaming
          </Badge>
        </Group>
        <Text size='xs' c='dimmed'>
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </Text>
      </Box>

      {/* Scrollable Event List */}
      <Box
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        p='md'
      >
        <Stack gap='sm'>
          {events.map((event) => (
            <Box
              key={event.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '3px 1fr',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--mantine-color-gray-1)',
              }}
            >
              <Box
                style={{
                  width: '3px',
                  backgroundColor: `var(--mantine-color-${KIND_COLORS[event.kind]}-6)`,
                  borderRadius: '2px',
                }}
              />
              <Stack gap={2}>
                <Text fw={700} size='xs'>
                  {event.tool}
                </Text>
                <Text size='xs' c='dimmed' style={{ wordBreak: 'break-word' }}>
                  {event.msg}
                </Text>
                <Text size='xs' c='dimmed' ta='right'>
                  {getRelativeTime(event.ts)}
                </Text>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Footer */}
      <Box
        p='md'
        style={{
          borderTop: '1px solid var(--mantine-color-gray-2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text size='xs' c='dimmed'>
          tool calls/min: —
        </Text>
        <Anchor href='#' size='xs' underline='hover'>
          Open log
        </Anchor>
      </Box>
    </Stack>
  )
}
