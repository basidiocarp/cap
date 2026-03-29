import { Button, Grid } from '@mantine/core'

import type { CanopySnapshot } from '../../lib/api'
import type { CanopySavedView } from './canopy-filters'

interface CanopyQueueSnapshotState {
  error: unknown
  isLoading: boolean
  snapshot?: CanopySnapshot
}

export function CanopyQueuesSection({
  blockedQueueSnapshot,
  dependencyBlockedQueueSnapshot,
  criticalQueueSnapshot,
  followUpChainsQueueSnapshot,
  handoffQueueSnapshot,
  openQueuePreset,
  savedView,
  unacknowledgedQueueSnapshot,
}: {
  blockedQueueSnapshot: CanopyQueueSnapshotState
  dependencyBlockedQueueSnapshot: CanopyQueueSnapshotState
  criticalQueueSnapshot: CanopyQueueSnapshotState
  followUpChainsQueueSnapshot: CanopyQueueSnapshotState
  handoffQueueSnapshot: CanopyQueueSnapshotState
  openQueuePreset: (preset: CanopySavedView) => void
  savedView: CanopySavedView
  unacknowledgedQueueSnapshot: CanopyQueueSnapshotState
}) {
  const renderQueueCount = (state: CanopyQueueSnapshotState) => {
    if (state.error) return 'error'
    if (state.isLoading) return '...'
    return state.snapshot?.tasks.length ?? 0
  }

  return (
    <Grid>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('critical')}
          variant={savedView === 'critical' ? 'filled' : 'light'}
        >
          Critical · {renderQueueCount(criticalQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('unacknowledged')}
          variant={savedView === 'unacknowledged' ? 'filled' : 'light'}
        >
          Unacknowledged · {renderQueueCount(unacknowledgedQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('blocked')}
          variant={savedView === 'blocked' ? 'filled' : 'light'}
        >
          Blocked · {renderQueueCount(blockedQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('blocked_by_dependencies')}
          variant={savedView === 'blocked_by_dependencies' ? 'filled' : 'light'}
        >
          Dependency blocked · {renderQueueCount(dependencyBlockedQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('handoffs')}
          variant={savedView === 'handoffs' ? 'filled' : 'light'}
        >
          Open handoffs · {renderQueueCount(handoffQueueSnapshot)}
        </Button>
      </Grid.Col>
      <Grid.Col span={{ base: 6, md: 3 }}>
        <Button
          fullWidth
          onClick={() => openQueuePreset('follow_up_chains')}
          variant={savedView === 'follow_up_chains' ? 'filled' : 'light'}
        >
          Follow-up chains · {renderQueueCount(followUpChainsQueueSnapshot)}
        </Button>
      </Grid.Col>
    </Grid>
  )
}
