import { Stack, Title } from '@mantine/core'
import { useState } from 'react'

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
  const { data: hyphaeData = null, isLoading: hyphaeLoading } = useHyphaeAnalytics()
  const { data: myceliumData = null, isLoading: myceliumLoading } = useMyceliumAnalytics()
  const { data: rhizomeData = null, isLoading: rhizomeLoading } = useRhizomeAnalytics()
  const { data: telemetryData = null, isLoading: telemetryLoading } = useTelemetry(isTelemetryTabActive)
  const { data: usageAggregate = null, isLoading: usageAggregateLoading } = useUsageAggregate(isUsageTabActive)
  const { data: usageTrend = null, isLoading: usageTrendLoading } = useUsageTrend(30, isUsageTabActive)
  const { data: usageSessions = null, isLoading: usageSessionsLoading } = useUsageSessions(20, isUsageTabActive)
  const { data: commandHistory = null } = useCommandHistory(50, isCommandHistoryTabActive)

  const loading =
    hyphaeLoading ||
    myceliumLoading ||
    rhizomeLoading ||
    telemetryLoading ||
    usageAggregateLoading ||
    usageTrendLoading ||
    usageSessionsLoading

  const totalTokensSaved = myceliumData ? myceliumData.total_stats.total_tokens_saved : null
  const memoryUtilization = hyphaeData ? Math.round(hyphaeData.memory_utilization.rate * 100) : null
  const languagesIndexed = rhizomeData?.available ? rhizomeData.languages.length : null

  return (
    <Stack>
      <Title order={2}>Analytics</Title>

      <AnalyticsHeader />

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
