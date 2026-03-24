import type { EcosystemStatus } from '../../lib/api'
import type { HookHealthSummary } from './statusHelpers'
import { getClaudeLifecycleAdapterEmptyState } from '../../lib/host-guidance'
import { missingLifecycleHooks } from '../../lib/onboarding'
import { summarizeHookHealth } from './statusHelpers'

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
