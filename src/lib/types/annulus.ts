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
