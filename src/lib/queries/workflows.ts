import { useQuery } from '@tanstack/react-query'

import { workflowsApi } from '../api'

export const workflowKeys = {
  all: () => ['workflows'] as const,
  detail: (id: string) => ['workflows', 'detail', id] as const,
  list: () => ['workflows', 'list'] as const,
  runs: () => ['workflows', 'runs'] as const,
}

export function useWorkflowsList() {
  return useQuery({
    queryFn: async () => {
      const response = await workflowsApi.list()
      return response.workflows
    },
    queryKey: workflowKeys.list(),
  })
}

export function useWorkflowDetail(id: string) {
  return useQuery({
    enabled: !!id,
    queryFn: async () => {
      const response = await workflowsApi.get(id)
      return response.yaml
    },
    queryKey: workflowKeys.detail(id),
  })
}

export function useWorkflowRuns(options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryFn: async () => {
      const response = await workflowsApi.runs()
      return response.runs
    },
    queryKey: workflowKeys.runs(),
    refetchInterval: options?.refetchInterval ?? false,
  })
}
