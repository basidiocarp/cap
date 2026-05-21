import { useQuery } from '@tanstack/react-query'

import { snapshotApi } from '../api/snapshot'

export const snapshotKeys = {
  snapshot: () => ['snapshot'] as const,
}

export function useSnapshot(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => snapshotApi.snapshot(),
    queryKey: snapshotKeys.snapshot(),
    refetchInterval: 30_000,
  })
}
