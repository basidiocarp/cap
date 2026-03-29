import { Grid } from '@mantine/core'

import { KpiCard } from '../../components/KpiCard'

export function AnalyticsSummaryCards({
  languagesIndexed,
  memoryUtilization,
  totalTokensSaved,
}: {
  languagesIndexed: number | null
  memoryUtilization: number | null
  totalTokensSaved: number | null
}) {
  return (
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
  )
}
