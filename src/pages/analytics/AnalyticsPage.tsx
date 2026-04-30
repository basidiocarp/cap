import { Stack, Title } from '@mantine/core'
import { useState } from 'react'

import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import {
  useCommandHistory,
  useEcosystemStatus,
  useEvaluation,
  useHyphaeAnalytics,
  useMyceliumAnalytics,
  useRhizomeAnalytics,
  useTelemetry,
  useUsageAggregate,
  useUsageSessions,
  useUsageTrend,
} from '../../lib/queries'
import { AnalyticsHeader } from './AnalyticsHeader'
import { AnalyticsSummaryCards } from './AnalyticsSummaryCards'
import { AnalyticsTabs } from './AnalyticsTabs'

const DEFAULT_TAB = 'token-savings'

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB)

  const isCommandHistoryTabActive = activeTab === 'command-history'
  const isEvaluationTabActive = activeTab === 'evaluation'
  const isTelemetryTabActive = activeTab === 'telemetry'
  const isEcosystemTabActive = activeTab === 'ecosystem'
  const isUsageTabActive = activeTab === 'usage'

  const { data: ecosystemData = null } = useEcosystemStatus(isEcosystemTabActive)
  const { data: evaluationData = null } = useEvaluation(14, isEvaluationTabActive)
  const { data: hyphaeData = null, error: hyphaeError, isLoading: hyphaeLoading } = useHyphaeAnalytics()
  const { data: myceliumData = null, error: myceliumError, isLoading: myceliumLoading } = useMyceliumAnalytics()
  const { data: rhizomeData = null, error: rhizomeError, isLoading: rhizomeLoading } = useRhizomeAnalytics()
  const { data: telemetryData = null } = useTelemetry(isTelemetryTabActive)
  const { data: usageAggregate = null } = useUsageAggregate(isUsageTabActive)
  const { data: usageTrend = null } = useUsageTrend(30, isUsageTabActive)
  const { data: usageSessions = null } = useUsageSessions(20, isUsageTabActive)
  const { data: commandHistory = null } = useCommandHistory(50, isCommandHistoryTabActive)

  // Only the three always-on queries gate the summary cards spinner.
  // Tab-scoped queries (telemetry, usage, etc.) manage their own loading within each tab.
  const loading = hyphaeLoading || myceliumLoading || rhizomeLoading

  const dataError = hyphaeError ?? myceliumError ?? rhizomeError

  const totalTokensSaved = myceliumData ? myceliumData.total_stats.total_tokens_saved : null
  const memoryUtilization = hyphaeData ? Math.round(hyphaeData.memory_utilization.rate * 100) : null
  const languagesIndexed = rhizomeData?.available ? rhizomeData.languages.length : null

  return (
    <Stack>
      <Title order={2}>Analytics</Title>

      <AnalyticsHeader />

      {dataError ? <ErrorAlert error={dataError} title='Analytics data partially unavailable' /> : null}

      {loading && <PageLoader mt='xl' />}

      <AnalyticsSummaryCards
        languagesIndexed={languagesIndexed}
        memoryUtilization={memoryUtilization}
        totalTokensSaved={totalTokensSaved}
      />

      <AnalyticsTabs
        activeTab={activeTab}
        commandHistory={commandHistory}
        ecosystemData={ecosystemData}
        evaluationData={evaluationData}
        hyphaeData={hyphaeData}
        myceliumData={myceliumData}
        onTabChange={setActiveTab}
        rhizomeData={rhizomeData}
        telemetryData={telemetryData}
        usageAggregate={usageAggregate}
        usageSessions={usageSessions}
        usageTrend={usageTrend}
      />
    </Stack>
  )
}
