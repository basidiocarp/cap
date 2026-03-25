import { Badge, Grid, Stack, Text } from '@mantine/core'

import type { EcosystemStatus } from '../../lib/api'
import type { AllowedStipeAction } from '../../lib/onboarding'
import type { EcosystemReadinessModel } from '../../lib/readiness'
import { ReadinessQuickActions } from '../../components/ReadinessQuickActions'
import { getToolQuickActions } from '../../lib/readiness'
import { StatusToolCard } from './StatusToolCard'

export function MyceliumStatusCard({
  actionIsRunning,
  onRefresh,
  onRun,
  readiness,
  status,
}: {
  actionIsRunning: (actionKey?: AllowedStipeAction) => boolean
  onRefresh: () => void
  onRun: (actionKey: AllowedStipeAction) => void
  readiness: EcosystemReadinessModel
  status: EcosystemStatus
}) {
  return (
    <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
      <StatusToolCard
        available={status.mycelium.available}
        description='Token compression proxy'
        title='Mycelium'
      >
        <Stack gap='xs'>
          {status.mycelium.version && (
            <Badge
              color='mycelium'
              size='sm'
              variant='light'
            >
              v{status.mycelium.version}
            </Badge>
          )}
          {status.mycelium.available && (
            <Text
              c='dimmed'
              size='sm'
            >
              Mycelium is ready for command filtering and token savings analytics.
            </Text>
          )}
          {!status.mycelium.available && (
            <Text
              c='dimmed'
              size='xs'
            >
              No Mycelium proxy is detected yet. Install with: cargo install mycelium, or open onboarding for the repair path.
            </Text>
          )}
          <ReadinessQuickActions
            actionIsRunning={actionIsRunning}
            actions={getToolQuickActions('mycelium', readiness, status)}
            onRefresh={onRefresh}
            onRun={onRun}
          />
        </Stack>
      </StatusToolCard>
    </Grid.Col>
  )
}
