import { Badge, Group, Text } from '@mantine/core'

export interface HealthStripProps {
  tools: { name: string; status: 'up' | 'degraded' | 'down' }[]
  tokensSaved?: number
  memoryUsagePct?: number
}

export function HealthStrip({ tools, tokensSaved, memoryUsagePct }: HealthStripProps) {
  return (
    <Group gap='xs' wrap='wrap'>
      {tools.map((t) => (
        <Badge
          color={t.status === 'up' ? 'mycelium' : t.status === 'degraded' ? 'substrate' : 'gill'}
          key={t.name}
          size='sm'
          variant='dot'
        >
          {t.name}
        </Badge>
      ))}
      {tokensSaved !== undefined && (
        <Text c='dimmed' size='xs'>
          ↓ {(tokensSaved / 1000).toFixed(0)}k tokens saved
        </Text>
      )}
      {memoryUsagePct !== undefined && (
        <Text c='dimmed' size='xs'>
          mem {Math.round(memoryUsagePct * 100)}%
        </Text>
      )}
    </Group>
  )
}
