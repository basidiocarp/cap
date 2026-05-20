import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { StatuslineConfig } from '../api/statusline'
import { statuslineApi } from '../api/statusline'

export const statuslineKeys = {
  config: () => ['statusline', 'config'] as const,
}

export function useStatuslineConfig(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => statuslineApi.get(),
    queryKey: statuslineKeys.config(),
    staleTime: 30_000,
  })
}

export function useSaveStatuslineConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (config: Omit<StatuslineConfig, 'config_path' | 'exists'>) => statuslineApi.save(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statuslineKeys.config() })
    },
  })
}
