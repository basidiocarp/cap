import type { LspInfo, ProjectInfo, RhizomeStatus } from './rhizome'

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

export interface HookLifecycleStatus {
  event: string
  installed: boolean
  matching_hooks: number
}

export interface HookHealthResult {
  error_count: number
  installed_hooks: HookInfo[]
  lifecycle: HookLifecycleStatus[]
  recent_errors: HookError[]
}

export interface EcosystemStatus {
  hyphae: { available: boolean; memories: number; memoirs: number; version: string | null }
  hooks: HookHealthResult
  lsps: LspInfo[]
  mycelium: { available: boolean; version: string | null }
  project: ProjectInfo
  rhizome: RhizomeStatus
}
