import { Button, Grid } from '@mantine/core'

import type { CanopySavedView } from './canopy-filters'
import type { CanopyQueueSnapshotWithDefinition } from './useCanopyQueueSnapshots'

export function CanopyQueuesSection({
  queueSnapshots,
  openQueuePreset,
  savedView,
}: {
  queueSnapshots: CanopyQueueSnapshotWithDefinition[]
  openQueuePreset: (preset: CanopySavedView) => void
  savedView: CanopySavedView
}) {
  const renderQueueCount = (state: CanopyQueueSnapshotWithDefinition) => {
    if (state.error) return 'error'
    if (state.isLoading) return '...'
    return state.snapshot?.tasks.length ?? 0
  }

  return (
    <Grid>
      {queueSnapshots.map((queue) => (
        <Grid.Col
          key={queue.preset}
          span={{ base: 6, md: 3 }}
        >
          <Button
            fullWidth
            onClick={() => openQueuePreset(queue.preset as CanopySavedView)}
            variant={savedView === queue.preset ? 'filled' : 'light'}
          >
            {queue.label} · {renderQueueCount(queue)}
          </Button>
        </Grid.Col>
      ))}
    </Grid>
  )
}
