import { useQuery } from '@tanstack/react-query'

import { canopyApi } from '../api'

export const canopyKeys = {
  snapshot: (options?: {
    acknowledged?: string
    attentionAtLeast?: string
    preset?: string
    priorityAtLeast?: string
    project?: string
    severityAtLeast?: string
    sort?: string
    view?: string
  }) =>
    [
      'canopy',
      'snapshot',
      options?.project,
      options?.preset,
      options?.sort,
      options?.view,
      options?.priorityAtLeast,
      options?.severityAtLeast,
      options?.acknowledged,
      options?.attentionAtLeast,
    ] as const,
  task: (taskId: string) => ['canopy', 'task', taskId] as const,
}

export function useCanopySnapshot(options?: {
  acknowledged?: string
  attentionAtLeast?: string
  enabled?: boolean
  preset?: string
  priorityAtLeast?: string
  project?: string
  severityAtLeast?: string
  sort?: string
  view?: string
}) {
  return useQuery({
    enabled: options?.enabled ?? true,
    queryFn: () =>
      canopyApi.snapshot({
        acknowledged: options?.acknowledged,
        attentionAtLeast: options?.attentionAtLeast,
        preset: options?.preset,
        priorityAtLeast: options?.priorityAtLeast,
        project: options?.project,
        severityAtLeast: options?.severityAtLeast,
        sort: options?.sort,
        view: options?.view,
      }),
    queryKey: canopyKeys.snapshot({
      acknowledged: options?.acknowledged,
      attentionAtLeast: options?.attentionAtLeast,
      preset: options?.preset,
      priorityAtLeast: options?.priorityAtLeast,
      project: options?.project,
      severityAtLeast: options?.severityAtLeast,
      sort: options?.sort,
      view: options?.view,
    }),
  })
}

export function useCanopyTaskDetail(taskId: string) {
  return useQuery({
    enabled: !!taskId,
    queryFn: () => canopyApi.task(taskId),
    queryKey: canopyKeys.task(taskId),
  })
}
