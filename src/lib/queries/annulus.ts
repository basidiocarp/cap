import { useQuery } from '@tanstack/react-query'

import { annulusApi } from '../api'

export const annulusKeys = {
  status: () => ['annulus', 'status'] as const,
}

export function useAnnulusStatus(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => annulusApi.status(),
    queryKey: annulusKeys.status(),
    refetchInterval: 30_000,
  })
}
