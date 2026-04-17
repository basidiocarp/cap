import type {
  CanopyAgent,
  CanopyHandoffActionInput,
  CanopySnapshot,
  CanopySnapshotPreset,
  CanopyTaskActionInput,
  CanopyTaskDetail,
  CanopyTaskPriority,
  CanopyTaskSeverity,
} from '../types'
import { get, post } from './http'

export const canopyApi = {
  agents: (options?: { project?: string }) =>
    get<CanopyAgent[]>('/canopy/agents', {
      project: options?.project ?? '',
    }),
  handoffAction: (handoffId: string, body: CanopyHandoffActionInput) =>
    post(`/canopy/handoffs/${encodeURIComponent(handoffId)}/actions`, body),
  snapshot: (options?: {
    acknowledged?: string
    attentionAtLeast?: string
    preset?: CanopySnapshotPreset | string
    priorityAtLeast?: CanopyTaskPriority | string
    project?: string
    severityAtLeast?: CanopyTaskSeverity | string
    sort?: string
    view?: string
  }) =>
    get<CanopySnapshot>('/canopy/snapshot', {
      acknowledged: options?.acknowledged ?? '',
      attention_at_least: options?.attentionAtLeast ?? '',
      preset: options?.preset ?? '',
      priority_at_least: options?.priorityAtLeast ?? '',
      project: options?.project ?? '',
      severity_at_least: options?.severityAtLeast ?? '',
      sort: options?.sort ?? '',
      view: options?.view ?? '',
    }),
  task: (taskId: string) => get<CanopyTaskDetail>(`/canopy/tasks/${encodeURIComponent(taskId)}`),
  taskAction: (taskId: string, body: CanopyTaskActionInput) => post(`/canopy/tasks/${encodeURIComponent(taskId)}/actions`, body),
}
