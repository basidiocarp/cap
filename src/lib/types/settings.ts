export interface EcosystemSettings {
  hyphae: { config_path: string | null; db_path: string; db_size_bytes: number }
  mycelium: { config_path: string | null; filters: { hyphae: { enabled: boolean }; rhizome: { enabled: boolean } } }
  rhizome: { auto_export: boolean; config_path: string | null; languages_enabled: number }
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
