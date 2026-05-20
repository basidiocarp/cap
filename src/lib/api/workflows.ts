import type { WorkflowRunStatus, WorkflowSummary } from '../types'
import { get } from './http'

export const workflowsApi = {
  get: (id: string) =>
    get<{
      yaml: string
    }>(`/workflows/${id}`),
  list: () =>
    get<{
      workflows: WorkflowSummary[]
    }>('/workflows/list'),

  runs: () =>
    get<{
      runs: WorkflowRunStatus[]
      error?: string
    }>('/workflows/runs/status'),
}
