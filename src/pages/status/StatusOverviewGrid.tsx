import { Grid } from '@mantine/core'

import type { EcosystemStatus, StipeRepairPlan } from '../../lib/api'
import { StatusAgentRuntimesCard } from './StatusAgentRuntimesCard'
import { StatusProjectContextCard } from './StatusProjectContextCard'
import { StatusToolCards } from './StatusToolsGrid'

export function StatusOverviewGrid({
  onRefresh,
  repairPlan,
  status,
}: {
  onRefresh: () => void
  repairPlan?: StipeRepairPlan
  status: EcosystemStatus
}) {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
        <StatusProjectContextCard status={status} />
      </Grid.Col>

      <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
        <StatusAgentRuntimesCard status={status} />
      </Grid.Col>

      <StatusToolCards
        onRefresh={onRefresh}
        repairPlan={repairPlan}
        status={status}
      />
    </Grid>
  )
}
