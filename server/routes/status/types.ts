export interface LspInfo {
  available: boolean
  bin: string
  language: string
  name: string
  running: boolean
}

export type StatusHost = 'claude-code' | 'codex' | 'cursor' | 'unknown'
export type AdapterStatus = 'connected' | 'partial' | 'none'

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
  lifecycle: HookLifecycleStatus[]
  recent_errors: HookError[]
}

export interface HookLifecycleStatus {
  event: string
  installed: boolean
  matching_hooks: number
}

export interface CodexNotifyStatus {
  command: string | null
  config_path: string | null
  configured: boolean
  contract_matched: boolean
}

export interface AgentRuntimeStatus {
  adapter: {
    configured: boolean
    detected: boolean
    kind: 'hooks' | 'mcp'
    label: string
  }
  config_path: string | null
  configured: boolean
  detected: boolean
  integration: 'hooks' | 'mcp'
  notify?: CodexNotifyStatus
  resolved_config_path: string
  resolved_config_source: 'config_file' | 'platform_default'
}

export interface HyphaeMemoryActivity {
  codex_memory_count: number
  last_codex_memory_at: string | null
  last_session_memory_at: string | null
  last_session_topic: string | null
  recent_session_memory_count: number
}

export interface StatusResult {
  adapter_status?: AdapterStatus
  agents: {
    claude_code: AgentRuntimeStatus
    codex: AgentRuntimeStatus
  }
  host?: StatusHost
  hyphae: {
    activity: HyphaeMemoryActivity
    available: boolean
    memories: number
    memoirs: number
    version: string | null
  }
  hooks: HookHealthResult
  lsps: LspInfo[]
  mycelium: { available: boolean; version: string | null }
  project: { active: string; recent: string[] }
  rhizome: { available: boolean; backend: 'tree-sitter' | 'lsp' | null; languages: string[] }
}

export type PromiseFilled<T> = { status: 'fulfilled'; value: T }
