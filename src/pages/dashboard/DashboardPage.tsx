import { Stack, Title } from '@mantine/core'
import { useQueries } from '@tanstack/react-query'

import type { GainResult, HealthResult, SessionRecord, Stats, TopicSummary } from '../../lib/api'
import { EcosystemStatusPanel } from '../../components/EcosystemStatusPanel'
import { EmptyState } from '../../components/EmptyState'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { hyphaeApi, myceliumApi } from '../../lib/api'
import { hyphaeKeys, myceliumKeys, useEcosystemStatus } from '../../lib/queries'
import { useDashboardVariantStore } from '../../stores/dashboard-variant-store'
import { DashboardConfident } from './variants/DashboardConfident'
import { DashboardFieldLab } from './variants/DashboardFieldLab'
import { DashboardOperator } from './variants/DashboardOperator'

export function DashboardPage() {
  const [statsQuery, topicsQuery, healthQuery, gainQuery, sessionsQuery] = useQueries({
    queries: [
      { queryFn: () => hyphaeApi.stats(), queryKey: hyphaeKeys.stats() },
      { queryFn: () => hyphaeApi.topics(), queryKey: hyphaeKeys.topics() },
      { queryFn: () => hyphaeApi.health(), queryKey: hyphaeKeys.health() },
      { queryFn: () => myceliumApi.gain(), queryKey: myceliumKeys.gain() },
      { queryFn: () => hyphaeApi.sessions(undefined, 10), queryKey: hyphaeKeys.sessions() },
    ],
  })

  const { data: ecosystemStatus } = useEcosystemStatus()
  const { variant } = useDashboardVariantStore()

  const loading = statsQuery.isLoading || topicsQuery.isLoading || healthQuery.isLoading || gainQuery.isLoading || sessionsQuery.isLoading

  const stats = statsQuery.data as Stats | undefined
  const topics = (topicsQuery.data ?? []) as TopicSummary[]
  const health = (healthQuery.data ?? []) as HealthResult[]
  const gain = gainQuery.data as GainResult | undefined
  const sessions = (sessionsQuery.data ?? []) as SessionRecord[]

  if (loading) {
    return <PageLoader />
  }

  const VariantComponent =
    variant === 'confident' ? DashboardConfident : variant === 'fieldlab' ? DashboardFieldLab : DashboardOperator

  return (
    <Stack>
      <Title order={2}>Dashboard</Title>

      <EcosystemStatusPanel />

      <ErrorAlert
        error={statsQuery.error}
        title='Failed to load analytics'
      />
      <ErrorAlert
        error={gainQuery.error}
        title='Failed to load savings data'
      />
      <ErrorAlert
        error={topicsQuery.error}
        title='Failed to load topics'
      />
      <ErrorAlert
        error={healthQuery.error}
        title='Failed to load health status'
      />
      <ErrorAlert
        error={sessionsQuery.error}
        title='Failed to load sessions'
      />

      {!statsQuery.error && !stats && <EmptyState>No analytics data available yet.</EmptyState>}

      {stats && (
        <VariantComponent
          ecosystemStatus={ecosystemStatus}
          gain={gain}
          health={health}
          sessions={sessions}
          stats={stats}
          topics={topics}
        />
      )}
    </Stack>
  )
}
