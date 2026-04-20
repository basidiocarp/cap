import type { EcosystemStatus } from './types'

export interface AvailabilityReport {
  tier1_healthy: boolean // hyphae (critical — red if down)
  tier2_healthy: boolean // mycelium + rhizome (degraded — amber if down)
  status: 'green' | 'amber' | 'red'
}

export function buildAvailabilityReport(status: EcosystemStatus): AvailabilityReport {
  const tier1_healthy = status.hyphae.available
  const tier2_healthy = status.mycelium.available && status.rhizome !== undefined
  const serviceStatus = !tier1_healthy ? 'red' : !tier2_healthy ? 'amber' : 'green'
  return { tier1_healthy, tier2_healthy, status: serviceStatus }
}
