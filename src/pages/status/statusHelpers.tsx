import { Badge } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck, IconCircleX } from '@tabler/icons-react'

import type { EcosystemStatus } from '../../lib/api'
import { getClaudeLifecycleAdapterEmptyState } from '../../lib/host-guidance'
import { missingLifecycleHooks } from '../../lib/onboarding'

export interface HookHealthSummary {
  color: string
  detail: string
  label: string
}

export function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <Badge
      color={available ? 'mycelium' : 'decay'}
      leftSection={available ? <IconCircleCheck size={12} /> : <IconCircleX size={12} />}
      size='sm'
      variant='light'
    >
      {available ? 'Available' : 'Unavailable'}
    </Badge>
  )
}

export function HookSummaryIcon({ label }: { label: string }) {
  return ['Covered', 'Codex ready', 'Optional'].includes(label) ? <IconCircleCheck size={12} /> : <IconAlertCircle size={12} />
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
        ? emptyState.detail
        : `${emptyState.detail} Codex readiness is shown separately in the agent runtimes and Codex mode sections.`,
      label: 'Not configured',
    }
  }

  if (status.hooks.error_count > 0) {
    return {
      color: 'red',
      detail: `${status.hooks.error_count} recent hook errors were recorded.`,
      label: 'Needs repair',
    }
  }

  if (missingLifecycle.length > 0) {
    return {
      color: 'orange',
      detail: `Coverage is missing for ${missingLifecycle.join(', ')}.`,
      label: 'Partial coverage',
    }
  }

  return {
    color: 'mycelium',
    detail: 'Recommended lifecycle coverage is installed and no recent errors were recorded.',
    label: 'Covered',
  }
}
