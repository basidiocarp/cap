import { Button, Group, Stack, Text } from '@mantine/core'

import type { CanopySavedView, CanopySortMode } from './canopy-filters'
import { SAVED_VIEW_OPTIONS } from './canopy-filters'

export function CanopySavedViewsSection({
  openSavedView,
  savedView,
  sortMode,
}: {
  openSavedView: (preset: CanopySavedView) => void
  savedView: CanopySavedView
  sortMode: CanopySortMode
}) {
  return (
    <Stack gap='sm'>
      <Text
        c='dimmed'
        size='sm'
      >
        Switch the board between common operator slices without rebuilding filters by hand.
      </Text>
      <Group gap='xs'>
        {SAVED_VIEW_OPTIONS.map((view) => (
          <Button
            key={view.value}
            onClick={() => openSavedView(view.value)}
            size='xs'
            variant={savedView === view.value ? 'filled' : 'light'}
          >
            {view.label}
          </Button>
        ))}
      </Group>
      <Text
        c='dimmed'
        size='xs'
      >
        {SAVED_VIEW_OPTIONS.find((view) => view.value === savedView)?.description}. Runtime sort: {sortMode.replaceAll('_', ' ')}.
      </Text>
    </Stack>
  )
}
