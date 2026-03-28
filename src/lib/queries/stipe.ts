import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { stipeApi } from '../api'
import { settingsKeys } from './settings'
import { statusKeys } from './status'

export const stipeKeys = {
  repairPlan: () => ['stipe', 'repair-plan'] as const,
}

export function useStipeRepairPlan() {
  return useQuery({
    queryFn: () => stipeApi.repairPlan(),
    queryKey: stipeKeys.repairPlan(),
    refetchInterval: 30_000,
  })
}

export function useRunStipeAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: Parameters<typeof stipeApi.run>[0]) => stipeApi.run(action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.ecosystem() })
      queryClient.invalidateQueries({ queryKey: stipeKeys.repairPlan() })
      queryClient.invalidateQueries({ queryKey: settingsKeys.get() })
    },
  })
}
