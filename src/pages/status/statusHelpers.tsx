import { Badge } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck, IconCircleX } from '@tabler/icons-react'

import type { EcosystemStatus } from '../../lib/api'
import { missingLifecycleHooks } from '../../lib/onboarding'

export interface HookHealthSummary {
  color: string
  detail: string
  label: string
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
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
    return {
      color: 'gray',
      detail: claudeConfigured
        ? 'Claude Code is detected, but no Claude lifecycle hooks are installed yet.'
        : 'No Claude lifecycle adapter is installed yet. Codex readiness is shown separately in the agent runtimes and Codex mode sections.',
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
