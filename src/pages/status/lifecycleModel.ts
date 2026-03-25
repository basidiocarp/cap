import type { EcosystemStatus } from '../../lib/api'
import type { HookHealthSummary } from '../../lib/status-health'
import { getClaudeLifecycleAdapterEmptyState } from '../../lib/host-guidance'
import { missingLifecycleHooks } from '../../lib/onboarding'
import { summarizeHookHealth } from '../../lib/status-health'

export interface LifecycleAdaptersModel {
  emptyState: ReturnType<typeof getClaudeLifecycleAdapterEmptyState>
  hasErrors: boolean
  hooks: EcosystemStatus['hooks']
  missingLifecycle: string[]
  summary: HookHealthSummary
}

export function getLifecycleAdaptersModel(status: EcosystemStatus): LifecycleAdaptersModel {
  const hooks = status.hooks

  return {
    emptyState: getClaudeLifecycleAdapterEmptyState(status),
    hasErrors: hooks.error_count > 0,
    hooks,
    missingLifecycle: missingLifecycleHooks(status),
    summary: summarizeHookHealth(status),
  }
}
