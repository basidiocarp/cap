import { Grid } from '@mantine/core'

import type { EcosystemStatus, StipeRepairPlan } from '../../lib/api'
import { StipeActionFeedback } from '../../components/StipeActionFeedback'
import { getEcosystemReadinessModel } from '../../lib/readiness'
import { useStipeActionController } from '../../lib/stipe-actions'
import { HyphaeStatusCard } from './HyphaeStatusCard'
import { MyceliumStatusCard } from './MyceliumStatusCard'
import { RhizomeStatusCard } from './RhizomeStatusCard'

export function StatusToolCards({
  onRefresh,
  repairPlan,
  status,
}: {
  onRefresh: () => void
  repairPlan?: StipeRepairPlan
  status: EcosystemStatus
}) {
  const readiness = getEcosystemReadinessModel(status, repairPlan)
  const { actionIsRunning, runAction, runStipe } = useStipeActionController()

  return (
    <>
      <MyceliumStatusCard
        actionIsRunning={actionIsRunning}
        onRefresh={onRefresh}
        onRun={runAction}
        readiness={readiness}
        status={status}
      />
      <HyphaeStatusCard
        actionIsRunning={actionIsRunning}
        onRefresh={onRefresh}
        onRun={runAction}
        readiness={readiness}
        status={status}
      />
      <RhizomeStatusCard
        actionIsRunning={actionIsRunning}
        onRefresh={onRefresh}
        onRun={runAction}
        readiness={readiness}
        status={status}
      />
      {(runStipe.isError || runStipe.isSuccess) && (
        <Grid.Col span={12}>
          <StipeActionFeedback mutation={runStipe} />
        </Grid.Col>
      )}
    </>
  )
}
