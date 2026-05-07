export interface AnnulusToolReport {
  tool: string
  available: boolean
  tier: 'tier1' | 'tier2' | 'tier3'
  degraded_capabilities: string[]
}

export interface AnnulusStatus {
  available: boolean
  reports: AnnulusToolReport[]
}

export interface StatusSegment {
  id: string
  enabled: boolean
  config?: Record<string, unknown>
}

export interface StatusTheme {
  color_mode: 'auto' | 'always' | 'never'
  separator: string
}

export interface StatusMetadata {
  created_at?: string
  version?: string
  preset_name?: string | null
}

export interface StatusHostOverride {
  theme?: StatusTheme
  segments?: StatusSegment[]
}

export interface ResolvedStatusCustomization {
  schema_version: '1.0'
  segments: StatusSegment[]
  theme: StatusTheme
  host_overrides?: {
    claude_code?: StatusHostOverride
    codex?: StatusHostOverride
    cursor?: StatusHostOverride
  }
  metadata?: StatusMetadata
}
