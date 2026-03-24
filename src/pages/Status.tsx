import { Stack } from '@mantine/core'

import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { useEcosystemStatusController } from '../lib/ecosystem-status'
import { LanguageServersCard } from './status/LanguageServersCard'
import { LifecycleAdaptersCard } from './status/LifecycleAdaptersCard'
import { StatusArchitectureCard } from './status/StatusArchitectureCard'
import { StatusGettingStartedCard } from './status/StatusGettingStartedCard'
import { StatusHeader } from './status/StatusHeader'
import { StatusOverviewGrid } from './status/StatusOverviewGrid'

export function Status() {
  const { refreshAll, repairPlanQuery, statusQuery } = useEcosystemStatusController()
  const { data: status, error, isLoading } = statusQuery

  if (isLoading) {
    return <PageLoader mt='xl' />
  }

  return (
    <Stack>
      <StatusHeader onRefresh={refreshAll} />

      <ErrorAlert error={error} />

      {status && (
        <>
          <StatusGettingStartedCard
            onRefresh={refreshAll}
            repairPlan={repairPlanQuery.data}
            status={status}
          />

          <StatusArchitectureCard />

          <StatusOverviewGrid
            onRefresh={refreshAll}
            repairPlan={repairPlanQuery.data}
            status={status}
          />

          <LanguageServersCard status={status} />

          <LifecycleAdaptersCard status={status} />
        </>
      )}
    </Stack>
  )
}
