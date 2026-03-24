import { Stack } from '@mantine/core'

import { ErrorAlert } from '../components/ErrorAlert'
import { PageLoader } from '../components/PageLoader'
import { useEcosystemStatus } from '../lib/queries'
import { StatusArchitectureCard } from './status/StatusArchitectureCard'
import { StatusGettingStartedCard } from './status/StatusGettingStartedCard'
import { StatusHeader } from './status/StatusHeader'
import { LanguageServersCard, LifecycleAdaptersCard } from './status/StatusInfrastructureSections'
import { StatusOverviewGrid } from './status/StatusOverviewGrid'

export function Status() {
  const { data: status, error, isLoading, refetch } = useEcosystemStatus()

  if (isLoading) {
    return <PageLoader mt='xl' />
  }

  return (
    <Stack>
      <StatusHeader onRefresh={refetch} />

      <ErrorAlert error={error} />

      {status && (
        <>
          <StatusGettingStartedCard status={status} />

          <StatusArchitectureCard />

          <StatusOverviewGrid status={status} />

          <LanguageServersCard status={status} />

          <LifecycleAdaptersCard status={status} />
        </>
      )}
    </Stack>
  )
}
