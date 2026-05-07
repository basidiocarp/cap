import { Stack } from '@mantine/core'

import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { ToolingUnavailableState } from '../components/ToolingUnavailableState'
import { useEcosystemStatusController } from '../lib/ecosystem-status'
import { useHostCoverageStore } from '../store/host-coverage'
import { LanguageServersCard } from './status/LanguageServersCard'
import { LifecycleAdaptersCard } from './status/LifecycleAdaptersCard'
import { StatusArchitectureCard } from './status/StatusArchitectureCard'
import { StatusCustomizationCard } from './status/StatusCustomizationCard'
import { StatusGettingStartedCard } from './status/StatusGettingStartedCard'
import { StatusHeader } from './status/StatusHeader'
import { StatusOverviewGrid } from './status/StatusOverviewGrid'

export function Status() {
  const { refreshAll, repairPlanQuery, statusQuery } = useEcosystemStatusController()
  const { data: status, error, isLoading } = statusQuery
  const hostCoverageMode = useHostCoverageStore((state) => state.mode)

  if (isLoading) {
    return <PageLoader mt='xl' />
  }

  return (
    <Stack>
      <StatusHeader onRefresh={refreshAll} />

      <ErrorAlert error={error} />

      {!status ? (
        <ToolingUnavailableState
          description='Cap could not load ecosystem status for this environment.'
          hint='Status is the top-level health view for the project. If this keeps failing, use onboarding for guided repair or settings to confirm the local tool configuration is readable.'
          includeStatusLink={false}
          onRetry={refreshAll}
          retryLabel='Retry loading status'
          title='Status is unavailable'
        />
      ) : (
        <>
          <StatusGettingStartedCard
            hostCoverageMode={hostCoverageMode}
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

          <StatusCustomizationCard />
        </>
      )}
    </Stack>
  )
}
