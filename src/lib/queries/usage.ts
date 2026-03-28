import { useQuery } from '@tanstack/react-query'

import { usageApi } from '../api'

export const usageKeys = {
  aggregate: () => ['usage', 'aggregate'] as const,
  sessions: (since?: string, limit?: number) => ['usage', 'sessions', since, limit] as const,
  telemetry: () => ['usage', 'telemetry'] as const,
  trend: (days?: number) => ['usage', 'trend', days] as const,
}

export function useUsageAggregate(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => usageApi.aggregate(),
    queryKey: usageKeys.aggregate(),
    staleTime: 60_000,
  })
}

export function useUsageTrend(days = 30, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => usageApi.trend(days),
    queryKey: usageKeys.trend(days),
    staleTime: 60_000,
  })
}

export function useUsageSessions(limit = 20, enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => usageApi.sessions(undefined, limit),
    queryKey: usageKeys.sessions(undefined, limit),
    staleTime: 60_000,
  })
}

export function useTelemetry(enabled = true) {
  return useQuery({
    enabled,
    queryFn: () => usageApi.telemetry(),
    queryKey: usageKeys.telemetry(),
    staleTime: 60_000,
  })
}
