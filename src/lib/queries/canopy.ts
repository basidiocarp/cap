import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CanopyHandoffActionInput, CanopyTaskActionInput } from '../types'
import { canopyApi } from '../api'

export const canopyKeys = {
  agents: (options?: { project?: string }) => ['canopy', 'agents', options?.project] as const,
  notifications: () => ['canopy', 'notifications'] as const,
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

export function useCanopyTaskAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, ...input }: { taskId: string } & CanopyTaskActionInput) => canopyApi.taskAction(taskId, input),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['canopy'] })
      queryClient.invalidateQueries({ queryKey: canopyKeys.task(variables.taskId) })
    },
  })
}

export function useCanopyHandoffAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ handoffId, taskId, ...input }: { handoffId: string; taskId: string } & CanopyHandoffActionInput) =>
      canopyApi.handoffAction(handoffId, input),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['canopy'] })
      queryClient.invalidateQueries({ queryKey: canopyKeys.task(variables.taskId) })
    },
  })
}

export function useCanopyAgents(project?: string) {
  return useQuery({
    queryFn: () => canopyApi.agents({ project }),
    queryKey: canopyKeys.agents({ project }),
  })
}

export function useCanopyNotifications() {
  return useQuery({
    queryFn: () => canopyApi.notifications(),
    queryKey: canopyKeys.notifications(),
    refetchInterval: 10_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => canopyApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canopyKeys.notifications() })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => canopyApi.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: canopyKeys.notifications() })
    },
  })
}
