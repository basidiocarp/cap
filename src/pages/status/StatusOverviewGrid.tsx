import { Grid } from '@mantine/core'

import type { EcosystemStatus } from '../../lib/api'
import { StatusAgentRuntimesCard } from './StatusAgentRuntimesCard'
import { StatusProjectContextCard } from './StatusProjectContextCard'
import { StatusToolCards } from './StatusToolsGrid'

export function StatusOverviewGrid({ status }: { status: EcosystemStatus }) {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
        <StatusProjectContextCard status={status} />
      </Grid.Col>

      <Grid.Col span={{ base: 12, lg: 3, md: 6 }}>
        <StatusAgentRuntimesCard status={status} />
      </Grid.Col>

      <StatusToolCards status={status} />
    </Grid>
  )
}
