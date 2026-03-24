import type { ReactNode } from 'react'
import { Grid, Stack, Tabs, Title } from '@mantine/core'
import { IconActivity, IconBrain, IconChartBar, IconCode, IconCurrencyDollar, IconHistory, IconNetwork } from '@tabler/icons-react'
import { lazy, Suspense, useState } from 'react'

import { KpiCard } from '../components/KpiCard'
import { PageLoader } from '../components/PageLoader'
import {
  useCommandHistory,
  useEcosystemStatus,
  useHyphaeAnalytics,
  useMyceliumAnalytics,
  useRhizomeAnalytics,
  useTelemetry,
  useUsageAggregate,
  useUsageSessions,
  useUsageTrend,
} from '../lib/queries'

const TokenSavingsTab = lazy(() => import('./analytics/TokenSavingsTab').then((m) => ({ default: m.TokenSavingsTab })))
const CommandHistoryTab = lazy(() => import('./analytics/CommandHistoryTab').then((m) => ({ default: m.CommandHistoryTab })))
const MemoryHealthTab = lazy(() => import('./analytics/MemoryHealthTab').then((m) => ({ default: m.MemoryHealthTab })))
const TelemetryTab = lazy(() => import('./analytics/TelemetryTab').then((m) => ({ default: m.TelemetryTab })))
const CodeIntelligenceTab = lazy(() => import('./analytics/CodeIntelligenceTab').then((m) => ({ default: m.CodeIntelligenceTab })))
const EcosystemTab = lazy(() => import('./analytics/EcosystemTab').then((m) => ({ default: m.EcosystemTab })))
const UsageCostTab = lazy(() => import('./analytics/UsageCostTab').then((m) => ({ default: m.UsageCostTab })))

const DEFAULT_TAB = 'token-savings'

function AnalyticsPanel({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader mt='md' />}>{children}</Suspense>
}

export function Analytics() {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB)

  const isCommandHistoryTabActive = activeTab === 'command-history'
  const isTelemetryTabActive = activeTab === 'telemetry'
  const isEcosystemTabActive = activeTab === 'ecosystem'
  const isUsageTabActive = activeTab === 'usage'

  const { data: ecosystemData = null } = useEcosystemStatus(isEcosystemTabActive)
  const { data: hyphaeData = null, isLoading: hyphaeLoading } = useHyphaeAnalytics()
  const { data: myceliumData = null, isLoading: myceliumLoading } = useMyceliumAnalytics()
  const { data: rhizomeData = null, isLoading: rhizomeLoading } = useRhizomeAnalytics()
  const { data: telemetryData = null } = useTelemetry(isTelemetryTabActive)
  const { data: usageAggregate = null } = useUsageAggregate(isUsageTabActive)
  const { data: usageTrend = null } = useUsageTrend(30, isUsageTabActive)
  const { data: usageSessions = null } = useUsageSessions(20, isUsageTabActive)
  const { data: commandHistory = null } = useCommandHistory(50, isCommandHistoryTabActive)

  const loading = hyphaeLoading || myceliumLoading || rhizomeLoading

  const totalTokensSaved = myceliumData ? myceliumData.total_stats.total_tokens_saved : null

  const memoryUtilization = hyphaeData ? Math.round(hyphaeData.memory_utilization.rate * 100) : null

  const languagesIndexed = rhizomeData?.available ? rhizomeData.languages.length : null

  return (
    <Stack>
      <Title order={2}>Analytics</Title>

      {loading && <PageLoader mt='xl' />}

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='fruiting.6'
            label='Total Tokens Saved'
            value={totalTokensSaved != null ? totalTokensSaved.toLocaleString() : '\u2014'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='mycelium.7'
            label='Memory Utilization'
            value={memoryUtilization != null ? `${memoryUtilization}%` : '\u2014'}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='spore.6'
            label='Languages Indexed'
            value={languagesIndexed != null ? languagesIndexed.toLocaleString() : '\u2014'}
          />
        </Grid.Col>
      </Grid>

      <Tabs
        keepMounted={false}
        onChange={(value) => setActiveTab(value ?? DEFAULT_TAB)}
        value={activeTab}
      >
        <Tabs.List>
          <Tabs.Tab
            leftSection={<IconChartBar size={16} />}
            value='token-savings'
          >
            Token Savings
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconHistory size={16} />}
            value='command-history'
          >
            Command History
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconBrain size={16} />}
            value='memory-health'
          >
            Memory Health
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconActivity size={16} />}
            value='telemetry'
          >
            Telemetry
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconCode size={16} />}
            value='code-intelligence'
          >
            Code Intelligence
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconNetwork size={16} />}
            value='ecosystem'
          >
            Ecosystem
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconCurrencyDollar size={16} />}
            value='usage'
          >
            Usage &amp; Cost
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          pt='md'
          value='token-savings'
        >
          <AnalyticsPanel>
            <TokenSavingsTab data={myceliumData} />
          </AnalyticsPanel>
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='command-history'
        >
          <AnalyticsPanel>
            <CommandHistoryTab data={commandHistory} />
          </AnalyticsPanel>
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='memory-health'
        >
          <AnalyticsPanel>
            <MemoryHealthTab data={hyphaeData} />
          </AnalyticsPanel>
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='telemetry'
        >
          <AnalyticsPanel>
            <TelemetryTab data={telemetryData} />
          </AnalyticsPanel>
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='code-intelligence'
        >
          <AnalyticsPanel>
            <CodeIntelligenceTab data={rhizomeData} />
          </AnalyticsPanel>
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='ecosystem'
        >
          <AnalyticsPanel>
            <EcosystemTab data={ecosystemData} />
          </AnalyticsPanel>
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='usage'
        >
          <AnalyticsPanel>
            <UsageCostTab
              aggregate={usageAggregate}
              sessions={usageSessions}
              trend={usageTrend}
            />
          </AnalyticsPanel>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
