import { Grid } from '@mantine/core'

import type { Stats } from '../../lib/api'
import { KpiCard } from '../../components/KpiCard'

export function DashboardKpis({ gain, stats }: { gain: Record<string, unknown> | undefined; stats: Stats }) {
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
          value={gain && typeof gain.avg_savings_pct === 'number' ? `${(gain.avg_savings_pct as number).toFixed(1)}%` : '\u2014'}
        />
      </Grid.Col>
    </Grid>
  )
}
