import { Badge, Group, Progress, Stack, Text } from '@mantine/core'

import type { HealthResult } from '../../lib/api'
import { EmptyState } from '../../components/EmptyState'
import { SectionCard } from '../../components/SectionCard'

export function MemoryHealthSection({ health }: { health: HealthResult[] }) {
  return (
    <SectionCard
      h='100%'
      title='Memory Health'
    >
      {health.length > 0 ? (
        <Stack gap='sm'>
          {health.map((item) => (
            <div key={item.topic}>
              <Group
                justify='space-between'
                mb={4}
              >
                <Text size='sm'>{item.topic}</Text>
                <Group gap='xs'>
                  {item.critical_count > 0 && (
                    <Badge
                      color='gill'
                      size='xs'
                      variant='light'
                    >
                      {item.critical_count} critical
                    </Badge>
                  )}
                  {item.high_count > 0 && (
                    <Badge
                      color='fruiting'
                      size='xs'
                      variant='light'
                    >
                      {item.high_count} high
                    </Badge>
                  )}
                  {item.low_weight_count > 0 && (
                    <Badge
                      color='substrate'
                      size='xs'
                      variant='light'
                    >
                      {item.low_weight_count} fading
                    </Badge>
                  )}
                </Group>
              </Group>
              <Progress
                color={item.avg_weight > 0.7 ? 'mycelium' : item.avg_weight > 0.4 ? 'substrate' : 'decay'}
                value={item.avg_weight * 100}
              />
            </div>
          ))}
        </Stack>
      ) : (
        <EmptyState>No health data</EmptyState>
      )}
    </SectionCard>
  )
}
