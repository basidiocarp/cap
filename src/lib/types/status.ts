import type { LspInfo, ProjectInfo, RhizomeStatus } from './rhizome'

export interface CodexNotifyStatus {
  command: string | null
  config_path: string | null
  configured: boolean
  contract_matched: boolean
}

export interface AgentRuntimeStatus {
  config_path: string | null
  configured: boolean
  detected: boolean
  integration: 'hooks' | 'mcp'
  notify?: CodexNotifyStatus
}

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
  agents: {
    claude_code: AgentRuntimeStatus
    codex: AgentRuntimeStatus
  }
  hyphae: { available: boolean; memories: number; memoirs: number; version: string | null }
  hooks: HookHealthResult
  lsps: LspInfo[]
  mycelium: { available: boolean; version: string | null }
  project: ProjectInfo
  rhizome: RhizomeStatus
}
