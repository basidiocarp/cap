import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { settingsApi } from '../api'

export const settingsKeys = {
  get: () => ['settings'] as const,
  modes: () => ['settings', 'modes'] as const,
}

export function useSettings() {
  return useQuery({
    queryFn: () => settingsApi.get(),
    queryKey: settingsKeys.get(),
    staleTime: 60_000,
  })
}

export function usePruneHyphae() {
  return useMutation({
    mutationFn: (threshold?: number) => settingsApi.pruneHyphae(threshold),
  })
}

export function useModes() {
  return useQuery({
    queryFn: () => settingsApi.getModes(),
    queryKey: settingsKeys.modes(),
    staleTime: 30_000,
  })
}

export function useActivateMode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mode: string) => settingsApi.activateMode(mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.modes() })
    },
  })
}

export function useUpdateMycelium() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (config: { hyphae_enabled?: boolean; rhizome_enabled?: boolean }) => settingsApi.updateMycelium(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.get() })
    },
  })
}

export function useUpdateRhizome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (config: { auto_export?: boolean }) => settingsApi.updateRhizome(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.get() })
    },
  })
}
