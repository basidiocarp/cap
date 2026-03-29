import { Grid, Select, TextInput } from '@mantine/core'

import type {
  CanopyAcknowledgedFilter,
  CanopyPriorityFilter,
  CanopySearchParamUpdates,
  CanopySeverityFilter,
  CanopySortMode,
  CanopyStatusFilter,
} from './canopy-filters'
import { ACK_FILTER_OPTIONS, PRIORITY_FILTER_OPTIONS, SEVERITY_FILTER_OPTIONS, SORT_OPTIONS, STATUS_FILTER_OPTIONS } from './canopy-filters'

export function CanopyFilterPanel({
  acknowledgedFilter,
  priorityFilter,
  searchQuery,
  severityFilter,
  sortMode,
  statusFilter,
  updateSearchParams,
}: {
  acknowledgedFilter: CanopyAcknowledgedFilter
  priorityFilter: CanopyPriorityFilter
  searchQuery: string
  severityFilter: CanopySeverityFilter
  sortMode: CanopySortMode
  statusFilter: CanopyStatusFilter
  updateSearchParams: (updates: CanopySearchParamUpdates, options?: { replace?: boolean }) => void
}) {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label='Search tasks'
          onChange={(event) => updateSearchParams({ q: event.currentTarget.value, task: null })}
          placeholder='Filter by title, description, task id, or owner'
          value={searchQuery}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          data={STATUS_FILTER_OPTIONS}
          label='Status'
          onChange={(value) => updateSearchParams({ status: (value as CanopyStatusFilter | null) ?? 'all', task: null })}
          value={statusFilter}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          data={SORT_OPTIONS}
          label='Sort'
          onChange={(value) => updateSearchParams({ sort: (value as CanopySortMode | null) ?? 'status', task: null })}
          value={sortMode}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          data={PRIORITY_FILTER_OPTIONS}
          label='Priority threshold'
          onChange={(value) => updateSearchParams({ priority: (value as CanopyPriorityFilter | null) ?? 'all', task: null })}
          value={priorityFilter}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          data={SEVERITY_FILTER_OPTIONS}
          label='Severity threshold'
          onChange={(value) => updateSearchParams({ severity: (value as CanopySeverityFilter | null) ?? 'all', task: null })}
          value={severityFilter}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Select
          data={ACK_FILTER_OPTIONS}
          label='Acknowledgment'
          onChange={(value) => updateSearchParams({ ack: (value as CanopyAcknowledgedFilter | null) ?? 'all', task: null })}
          value={acknowledgedFilter}
        />
      </Grid.Col>
    </Grid>
  )
}
