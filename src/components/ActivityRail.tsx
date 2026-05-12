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
  code: 'spore',
  lifecycle: 'substrate',
  memory: 'mycelium',
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
    queryFn: async () => {
      const res = await fetch('/api/telemetry/activity/recent')
      if (!res.ok) throw new Error('Failed to fetch activity')
      return res.json() as Promise<ActivityEvent[]>
    },
    queryKey: ['activity-recent'],
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
      <Box
        p='md'
        style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
      >
        <Group
          justify='space-between'
          mb='xs'
        >
          <Text
            fw={600}
            size='sm'
          >
            Live Activity
          </Text>
          <Badge
            color='mycelium'
            size='xs'
            variant='dot'
          >
            streaming
          </Badge>
        </Group>
        <Text
          c='dimmed'
          size='xs'
        >
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </Text>
      </Box>

      {/* Scrollable Event List */}
      <Box
        p='md'
        style={{
          flex: 1,
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        {events.length === 0 ? (
          <Stack
            align='center'
            gap='sm'
            h='100%'
            justify='center'
          >
            <Text
              c='dimmed'
              size='sm'
            >
              No recent activity
            </Text>
          </Stack>
        ) : (
          <Stack gap='sm'>
            {events.map((event) => (
              <Box
                key={event.id}
                style={{
                  borderBottom: '1px solid var(--mantine-color-gray-1)',
                  display: 'grid',
                  gap: '8px',
                  gridTemplateColumns: '3px 1fr',
                  paddingBottom: '8px',
                }}
              >
                <Box
                  style={{
                    backgroundColor: `var(--mantine-color-${KIND_COLORS[event.kind]}-6)`,
                    borderRadius: '2px',
                    width: '3px',
                  }}
                />
                <Stack gap={2}>
                  <Text
                    fw={700}
                    size='xs'
                  >
                    {event.tool}
                  </Text>
                  <Text
                    c='dimmed'
                    size='xs'
                    style={{ wordBreak: 'break-word' }}
                  >
                    {event.msg}
                  </Text>
                  <Text
                    c='dimmed'
                    size='xs'
                    ta='right'
                  >
                    {getRelativeTime(event.ts)}
                  </Text>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Footer */}
      <Box
        p='md'
        style={{
          alignItems: 'center',
          borderTop: '1px solid var(--mantine-color-gray-2)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Text
          c='dimmed'
          size='xs'
        >
          tool calls/min: —
        </Text>
        <Anchor
          href='#'
          size='xs'
          underline='hover'
        >
          Open log
        </Anchor>
      </Box>
    </Stack>
  )
}
