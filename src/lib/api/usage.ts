import type { AggregateTelemetry, SessionUsage, UsageAggregate, UsageTrend } from '../types'
import { get } from './http'

export const usageApi = {
  aggregate: () => get<UsageAggregate>('/usage'),
  sessions: (since?: string, limit?: number) =>
    get<SessionUsage[]>('/usage/sessions', { limit: limit ? String(limit) : '', since: since ?? '' }),
  telemetry: () => get<AggregateTelemetry>('/telemetry'),
  trend: (days?: number) => get<UsageTrend[]>('/usage/trend', { days: days ? String(days) : '' }),
}
