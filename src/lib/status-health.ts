import type { EcosystemStatus } from './api'
import { getClaudeLifecycleAdapterEmptyState } from './host-guidance'
import { missingLifecycleHooks } from './onboarding'

export interface HookHealthSummary {
  color: string
  detail: string
  label: string
}

export function summarizeHookHealth(status: EcosystemStatus): HookHealthSummary {
  const missingLifecycle = missingLifecycleHooks(status)
  const hookCount = status.hooks.installed_hooks.length
  const claudeConfigured = status.agents.claude_code.adapter.configured

  if (hookCount === 0) {
    const emptyState = getClaudeLifecycleAdapterEmptyState(status)

    return {
      color: 'gray',
      detail: claudeConfigured
        ? `${emptyState.detail} Open onboarding to install the missing lifecycle hooks.`
        : `${emptyState.detail} Open onboarding to install Claude lifecycle capture, or ignore this section if you only use Codex.`,
      label: 'Not configured',
    }
  }

  if (status.hooks.error_count > 0) {
    return {
      color: 'red',
      detail: `${status.hooks.error_count} recent hook errors were recorded. Open onboarding to repair the lifecycle adapter, then refresh status.`,
      label: 'Needs repair',
    }
  }

  if (missingLifecycle.length > 0) {
    return {
      color: 'orange',
      detail: `Coverage is missing for ${missingLifecycle.join(', ')}. Open onboarding to install the missing lifecycle events.`,
      label: 'Partial coverage',
    }
  }

  return {
    color: 'mycelium',
    detail: 'Recommended lifecycle coverage is installed and no recent errors were recorded.',
    label: 'Covered',
  }
}
