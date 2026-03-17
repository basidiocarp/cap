import { Grid, Stack, Tabs, Title } from '@mantine/core'
import { IconBrain, IconChartBar, IconCode, IconNetwork } from '@tabler/icons-react'

import { KpiCard } from '../components/KpiCard'
import { PageLoader } from '../components/PageLoader'
import { useEcosystemStatus, useHyphaeAnalytics, useMyceliumAnalytics, useRhizomeAnalytics } from '../lib/queries'
import { CodeIntelligenceTab } from './analytics/CodeIntelligenceTab'
import { EcosystemTab } from './analytics/EcosystemTab'
import { MemoryHealthTab } from './analytics/MemoryHealthTab'
import { TokenSavingsTab } from './analytics/TokenSavingsTab'

export function Analytics() {
  const { data: ecosystemData = null, isLoading: ecosystemLoading } = useEcosystemStatus()
  const { data: hyphaeData = null, isLoading: hyphaeLoading } = useHyphaeAnalytics()
  const { data: myceliumData = null, isLoading: myceliumLoading } = useMyceliumAnalytics()
  const { data: rhizomeData = null, isLoading: rhizomeLoading } = useRhizomeAnalytics()

  const loading = ecosystemLoading || hyphaeLoading || myceliumLoading || rhizomeLoading

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

      <Tabs defaultValue='token-savings'>
        <Tabs.List>
          <Tabs.Tab
            leftSection={<IconChartBar size={16} />}
            value='token-savings'
          >
            Token Savings
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={<IconBrain size={16} />}
            value='memory-health'
          >
            Memory Health
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
        </Tabs.List>

        <Tabs.Panel
          pt='md'
          value='token-savings'
        >
          <TokenSavingsTab data={myceliumData} />
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='memory-health'
        >
          <MemoryHealthTab data={hyphaeData} />
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='code-intelligence'
        >
          <CodeIntelligenceTab data={rhizomeData} />
        </Tabs.Panel>

        <Tabs.Panel
          pt='md'
          value='ecosystem'
        >
          <EcosystemTab data={ecosystemData} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
