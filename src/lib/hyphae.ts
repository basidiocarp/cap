import type { EcosystemStatus } from './api'

export interface HyphaeMemoryFlowSummary {
  color: string
  detail: string
  label: string
  recommendation: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function summarizeHyphaeMemoryFlow(status: EcosystemStatus): HyphaeMemoryFlowSummary {
  if (!status.hyphae.available) {
    return {
      color: 'gray',
      detail: 'Hyphae is not available, so memory flow cannot be checked yet.',
      label: 'Unavailable',
      recommendation: 'Install Hyphae first, then return to Codex setup.',
    }
  }

  const { activity } = status.hyphae
  const codexConfigured = Boolean(status.agents.codex.notify?.configured || status.agents.codex.adapter.configured)

  if (activity.last_codex_memory_at) {
    return {
      color: 'mycelium',
      detail: `Last Codex memory ${timeAgo(activity.last_codex_memory_at)}. Recent session memories: ${activity.recent_session_memory_count} in the past day.`,
      label: 'Flowing',
      recommendation: 'Open Memories to inspect the latest Codex session entries.',
    }
  }

  if (codexConfigured) {
    if (activity.last_session_memory_at) {
      return {
        color: 'orange',
        detail: `Hyphae is storing session memories, but no Codex-tagged memory has landed yet. Last session memory: ${timeAgo(activity.last_session_memory_at)}.`,
        label: 'No Codex memories yet',
        recommendation: 'Complete one real Codex turn, then refresh this page to confirm end-to-end flow.',
      }
    }

    return {
      color: 'orange',
      detail: 'Codex is configured, but Hyphae has not stored a Codex memory yet.',
      label: 'No Codex memories yet',
      recommendation: 'Complete one real Codex turn, then refresh this page to confirm end-to-end flow.',
    }
  }

  if (activity.last_session_memory_at) {
    return {
      color: 'gray',
      detail: `Hyphae is storing session memories, but Codex is not configured enough to validate Codex-specific flow. Last session memory: ${timeAgo(activity.last_session_memory_at)}.`,
      label: 'Session activity only',
      recommendation: 'Finish Codex MCP and notify setup before using this as a Codex verification signal.',
    }
  }

  return {
    color: 'gray',
    detail: 'Hyphae is available, but no recent session memory activity was found.',
    label: 'No recent activity',
    recommendation: 'Run stipe doctor or complete a real agent turn after setup.',
  }
}
