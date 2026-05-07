import { useQuery } from '@tanstack/react-query'

import { annulusApi } from '../api'

export const annulusKeys = {
  configExport: () => ['annulus', 'config-export'] as const,
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

export function useStatusCustomization(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => annulusApi.configExport(),
    queryKey: annulusKeys.configExport(),
    refetchInterval: 60_000,
  })
}
