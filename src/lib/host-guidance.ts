import type { EcosystemStatus } from './api'

export interface GuidanceCopy {
  detail: string
  title: string
}

export function getAgentRuntimeGuidance(): GuidanceCopy {
  return {
    detail:
      'Claude uses lifecycle hooks. Codex uses MCP plus notify. Both adapters can be enabled together; if a runtime says it is not found, open onboarding to install the missing adapter before expecting more detailed status data.',
    title: 'Agent runtimes',
  }
}

export function getClaudeLifecycleAdapterEmptyState(status: EcosystemStatus): GuidanceCopy {
  if (status.host === 'codex' && status.adapter_status !== 'none' && !status.agents.claude_code.adapter.configured) {
    return {
      detail:
        'Codex is the active host on this machine, so Claude lifecycle hooks are optional. Install them only if you also want Claude Code session capture.',
      title: 'Claude lifecycle hooks are optional for Codex',
    }
  }

  if (status.host === 'cursor' && status.adapter_status === 'connected' && !status.agents.claude_code.adapter.configured) {
    return {
      detail:
        'Cursor is the active host on this machine, so Claude lifecycle hooks are optional. Install them only if you also want Claude Code session capture.',
      title: 'Claude lifecycle hooks are optional for Cursor',
    }
  }

  return {
    detail: status.agents.claude_code.adapter.configured
      ? 'Claude Code is detected, but no Claude lifecycle hooks are installed yet. Open onboarding to add SessionStart, PostToolUse, PreCompact, and SessionEnd.'
      : 'No Claude lifecycle adapter is installed yet. Open onboarding to wire SessionStart, PostToolUse, PreCompact, and SessionEnd into Claude lifecycle capture.',
    title: 'No Claude lifecycle adapter installed',
  }
}

export function getCodexModeGuidance(): GuidanceCopy {
  return {
    detail:
      'Use this page when you want host coverage working cleanly. Mycelium, Hyphae, Rhizome, Codex MCP, and Codex notify make Codex usable, and Claude lifecycle hooks can run alongside that when you also use Claude Code.',
    title: 'Host coverage',
  }
}

export function getToolSettingsGuidance(): GuidanceCopy {
  return {
    detail:
      'Settings tune installed tools. Use Status or Onboarding for host-adapter repair and install guidance; settings do not create missing adapters for you.',
    title: 'Tool configuration',
  }
}
