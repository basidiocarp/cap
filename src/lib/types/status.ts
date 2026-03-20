import type { LspInfo, RhizomeStatus } from './rhizome'

export interface HookInfo {
  command: string
  event: string
  matcher: string
}

export interface HookError {
  hook: string
  message: string
  timestamp: string
}

export interface HookHealthResult {
  error_count: number
  installed_hooks: HookInfo[]
  recent_errors: HookError[]
}

export interface EcosystemStatus {
  hyphae: { available: boolean; memories: number; memoirs: number; version: string | null }
  hooks: HookHealthResult
  lsps: LspInfo[]
  mycelium: { available: boolean; version: string | null }
  rhizome: RhizomeStatus
}
