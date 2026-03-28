import type { CommandHistory, GainResult, MyceliumAnalytics } from '../types'
import { get } from './http'

export const myceliumApi = {
  analytics: () => get<MyceliumAnalytics>('/mycelium/analytics'),
  commandHistory: (limit?: number, project?: string) =>
    get<CommandHistory>('/mycelium/history', { limit: limit ? String(limit) : '', project: project ?? '' }),
  gain: () => get<GainResult>('/mycelium/gain'),
  gainHistory: () => get<GainResult>('/mycelium/gain/history'),
}
