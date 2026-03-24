import type { EcosystemStatus } from './api'

export interface GuidanceCopy {
  detail: string
  title: string
}

export function getAgentRuntimeGuidance(): GuidanceCopy {
  return {
    detail:
      'Claude uses lifecycle hooks. Codex uses MCP plus notify. Both can be configured at the same time; the host coverage section shows the combined setup state.',
    title: 'Agent runtimes',
  }
}

export function getClaudeLifecycleAdapterEmptyState(status: EcosystemStatus): GuidanceCopy {
  return {
    detail: status.agents.claude_code.adapter.configured
      ? 'Claude Code is detected, but no Claude lifecycle hooks are installed yet.'
      : 'No Claude lifecycle adapter is installed yet. Use onboarding to wire SessionStart, PostToolUse, PreCompact, and SessionEnd into Claude lifecycle capture.',
    title: 'No Claude lifecycle adapter installed',
  }
}

export function getCodexModeGuidance(): GuidanceCopy {
  return {
    detail:
      'Use this page when you want host coverage working cleanly. Mycelium, Hyphae, Rhizome, Codex MCP, and Codex notify make Codex usable; Claude lifecycle hooks can be enabled alongside that when you also use Claude Code.',
    title: 'Host coverage',
  }
}

export function getToolSettingsGuidance(): GuidanceCopy {
  return {
    detail: 'Settings tune installed tools. Use Status or Onboarding for host-adapter repair and install guidance.',
    title: 'Tool configuration',
  }
}
