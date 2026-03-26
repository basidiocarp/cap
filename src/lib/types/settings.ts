export type PathSource = 'config_file' | 'env_override' | 'platform_default'

export interface EcosystemSettings {
  hyphae: {
    config_path: string | null
    config_present: boolean
    config_source: PathSource
    db_path: string
    db_source: PathSource
    db_size_bytes: number
    resolved_config_path: string
  }
  mycelium: {
    config_path: string | null
    config_present: boolean
    config_source: PathSource
    filters: { hyphae: { enabled: boolean }; rhizome: { enabled: boolean } }
    resolved_config_path: string
  }
  rhizome: {
    auto_export: boolean
    config_path: string | null
    config_present: boolean
    config_source: PathSource
    languages_enabled: number
    resolved_config_path: string
  }
}

export interface Mode {
  description: string
  hyphae_tools: string[]
  rhizome_tools: string[]
}

export interface ModeConfig {
  active: string
  modes: Record<string, Mode>
}

export interface PruneResult {
  message: string
  pruned: number
}

export interface LspLanguageStatus {
  language: string
  lsp_binary: string
  lsp_available: boolean
  lsp_path: string | null
  tree_sitter: boolean
}

export interface LspStatusResult {
  available: boolean
  languages: LspLanguageStatus[]
}

export interface LspInstallResult {
  installed: boolean
  language: string
  message: string
  path?: string
}
