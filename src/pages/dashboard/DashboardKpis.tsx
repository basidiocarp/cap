import { Grid } from '@mantine/core'

import type { GainResult, Stats } from '../../lib/api'
import { KpiCard } from '../../components/KpiCard'

export function DashboardKpis({ gain, stats }: { gain: GainResult | undefined; stats: Stats }) {
  const avgSavingsPct = gain?.avg_savings_pct ?? gain?.summary?.avg_savings_pct ?? null

  return (
    <Grid>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <KpiCard
          accent='mycelium.7'
          label='Memories'
          value={String(stats.total_memories)}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <KpiCard
          accent='spore.6'
          label='Topics'
          value={String(stats.total_topics)}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <KpiCard
          accent='substrate.6'
          label='Avg Weight'
          value={stats.avg_weight?.toFixed(3) ?? '\u2014'}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <KpiCard
          accent='fruiting.6'
          label='Token Savings'
          value={avgSavingsPct !== null ? `${avgSavingsPct.toFixed(1)}%` : '\u2014'}
        />
      </Grid.Col>
    </Grid>
  )
}
