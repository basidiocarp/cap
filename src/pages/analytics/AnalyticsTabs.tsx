import type { ReactNode } from 'react'
import { Tabs } from '@mantine/core'
import {
  IconActivity,
  IconBrain,
  IconChartBar,
  IconChartDots3,
  IconCode,
  IconCurrencyDollar,
  IconHistory,
  IconNetwork,
} from '@tabler/icons-react'
import { lazy, Suspense } from 'react'

import type {
  AggregateTelemetry,
  CommandHistory,
  EcosystemStatus,
  EvaluationResult,
  HyphaeAnalytics,
  MyceliumAnalytics,
  RhizomeAnalytics,
  SessionUsage,
  UsageAggregate,
  UsageTrend,
} from '../../lib/api'
import { PageLoader } from '../../components/PageLoader'

const TokenSavingsTab = lazy(() => import('./TokenSavingsTab').then((m) => ({ default: m.TokenSavingsTab })))
const CommandHistoryTab = lazy(() => import('./CommandHistoryTab').then((m) => ({ default: m.CommandHistoryTab })))
const MemoryHealthTab = lazy(() => import('./MemoryHealthTab').then((m) => ({ default: m.MemoryHealthTab })))
const TelemetryTab = lazy(() => import('./TelemetryTab').then((m) => ({ default: m.TelemetryTab })))
const CodeIntelligenceTab = lazy(() => import('./CodeIntelligenceTab').then((m) => ({ default: m.CodeIntelligenceTab })))
const EcosystemTab = lazy(() => import('./EcosystemTab').then((m) => ({ default: m.EcosystemTab })))
const UsageCostTab = lazy(() => import('./UsageCostTab').then((m) => ({ default: m.UsageCostTab })))
const EvaluationTab = lazy(() => import('./EvaluationTab').then((m) => ({ default: m.EvaluationTab })))

const DEFAULT_TAB = 'token-savings'

function AnalyticsPanel({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader mt='md' />}>{children}</Suspense>
}

export function AnalyticsTabs({
  activeTab,
  commandHistory,
  ecosystemData,
  evaluationData,
  hyphaeData,
  myceliumData,
  onTabChange,
  rhizomeData,
  telemetryData,
  usageAggregate,
  usageSessions,
  usageTrend,
}: {
  activeTab: string
  commandHistory: CommandHistory | null
  ecosystemData: EcosystemStatus | null
  evaluationData: EvaluationResult | null
  hyphaeData: HyphaeAnalytics | null
  myceliumData: MyceliumAnalytics | null
  onTabChange: (value: string) => void
  rhizomeData: RhizomeAnalytics | null
  telemetryData: AggregateTelemetry | null
  usageAggregate: UsageAggregate | null
  usageSessions: SessionUsage[] | null
  usageTrend: UsageTrend[] | null
}) {
  return (
    <Tabs
      keepMounted={false}
      onChange={(value) => onTabChange(value ?? DEFAULT_TAB)}
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
        <Tabs.Tab
          leftSection={<IconChartDots3 size={16} />}
          value='evaluation'
        >
          Evaluation
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

      <Tabs.Panel
        pt='md'
        value='evaluation'
      >
        <AnalyticsPanel>
          <EvaluationTab data={evaluationData} />
        </AnalyticsPanel>
      </Tabs.Panel>
    </Tabs>
  )
}
