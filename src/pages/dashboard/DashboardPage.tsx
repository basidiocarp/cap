import { Badge, Grid, Group, Stack, Title } from '@mantine/core'
import { useQueries } from '@tanstack/react-query'

import type { GainResult, HealthResult, Stats, TopicSummary } from '../../lib/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageLoader } from '../../components/PageLoader'
import { hyphaeApi, myceliumApi } from '../../lib/api'
import { hyphaeKeys, myceliumKeys, useEcosystemStatus } from '../../lib/queries'
import { DashboardKpis } from './DashboardKpis'
import { MemoryHealthSection } from './MemoryHealthSection'
import { QuickContextSection } from './QuickContextSection'
import { TopicsSection } from './TopicsSection'

export function DashboardPage() {
  const [statsQuery, topicsQuery, healthQuery, gainQuery] = useQueries({
    queries: [
      { queryFn: () => hyphaeApi.stats(), queryKey: hyphaeKeys.stats() },
      { queryFn: () => hyphaeApi.topics(), queryKey: hyphaeKeys.topics() },
      { queryFn: () => hyphaeApi.health(), queryKey: hyphaeKeys.health() },
      { queryFn: () => myceliumApi.gain(), queryKey: myceliumKeys.gain() },
    ],
  })

  const { data: ecosystemStatus } = useEcosystemStatus()

  const loading = statsQuery.isLoading || topicsQuery.isLoading || healthQuery.isLoading || gainQuery.isLoading
  const error = statsQuery.error || topicsQuery.error || healthQuery.error || gainQuery.error

  const stats = statsQuery.data as Stats | undefined
  const topics = (topicsQuery.data ?? []) as TopicSummary[]
  const health = (healthQuery.data ?? []) as HealthResult[]
  const gain = gainQuery.data as GainResult | undefined

  if (loading) {
    return <PageLoader />
  }

  if (error) {
    return <ErrorAlert error={error instanceof Error ? error : new Error('Failed to load')} />
  }

  return (
    <Stack>
      <Title order={2}>Dashboard</Title>

      {ecosystemStatus && (
        <Group gap='xs'>
          <Badge
            color={ecosystemStatus.mycelium.available ? 'mycelium' : 'red'}
            variant='light'
          >
            Mycelium {ecosystemStatus.mycelium.available ? '✓' : '✗'}
          </Badge>
          <Badge
            color={ecosystemStatus.hyphae.available ? 'substrate' : 'red'}
            variant='light'
          >
            Hyphae {ecosystemStatus.hyphae.available ? '✓' : '✗'}
          </Badge>
          <Badge
            color={ecosystemStatus.rhizome.available ? 'fruiting' : 'red'}
            variant='light'
          >
            Rhizome {ecosystemStatus.rhizome.available ? '✓' : '✗'}
          </Badge>
        </Group>
      )}

      {stats && (
        <DashboardKpis
          gain={gain}
          stats={stats}
        />
      )}

      <QuickContextSection />

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TopicsSection topics={topics} />
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <MemoryHealthSection health={health} />
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
