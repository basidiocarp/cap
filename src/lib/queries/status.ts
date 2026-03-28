import { useQuery } from '@tanstack/react-query'

import { statusApi } from '../api'

export const statusKeys = {
  ecosystem: () => ['status', 'ecosystem'] as const,
}

export function useEcosystemStatus(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => statusApi.ecosystem(),
    queryKey: statusKeys.ecosystem(),
    refetchInterval: 30_000,
  })
}
