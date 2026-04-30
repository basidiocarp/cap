import { useQuery } from '@tanstack/react-query'

import { myceliumApi } from '../api'

export const myceliumKeys = {
  analytics: () => ['mycelium', 'analytics'] as const,
  commandHistory: (limit?: number, project?: string) => ['mycelium', 'commandHistory', limit, project] as const,
  gain: () => ['mycelium', 'gain'] as const,
  gainHistory: () => ['mycelium', 'gainHistory'] as const,
  gainProjects: () => ['mycelium', 'gain', 'projects'] as const,
}

export function useGain() {
  return useQuery({ queryFn: () => myceliumApi.gain(), queryKey: myceliumKeys.gain() })
}

export function useMyceliumAnalytics(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => myceliumApi.analytics(),
    queryKey: myceliumKeys.analytics(),
  })
}

export function useCommandHistory(limit?: number, enabled = true, project?: string) {
  return useQuery({
    enabled,
    queryFn: () => myceliumApi.commandHistory(limit, project),
    queryKey: myceliumKeys.commandHistory(limit, project),
  })
}
