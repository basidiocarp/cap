import type { EcosystemSettings, ModeConfig, PruneResult } from '../types'
import { get, post, put } from './http'

export const settingsApi = {
  activateMode: (mode: string) => post<ModeConfig>('/settings/modes/activate', { mode }),
  get: () => get<EcosystemSettings>('/settings'),
  getModes: () => get<ModeConfig>('/settings/modes'),
  pruneHyphae: (threshold?: number) => post<PruneResult>('/settings/hyphae/prune', threshold !== undefined ? { threshold } : undefined),
  updateHyphae: (config: { embedding_model?: string; similarity_threshold?: number }) => put<EcosystemSettings>('/settings/hyphae', config),
  updateMycelium: (config: { hyphae_enabled?: boolean; rhizome_enabled?: boolean }) => put<EcosystemSettings>('/settings/mycelium', config),
  updateRhizome: (config: { auto_export?: boolean; languages?: string[] }) => put<EcosystemSettings>('/settings/rhizome', config),
}
