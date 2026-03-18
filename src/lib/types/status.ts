import type { LspInfo, RhizomeStatus } from './rhizome'

export interface EcosystemStatus {
  hyphae: { available: boolean; memories: number; memoirs: number; version: string | null }
  lsps: LspInfo[]
  mycelium: { available: boolean; version: string | null }
  rhizome: RhizomeStatus
}
