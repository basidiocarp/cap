import type { EcosystemStatus } from './api'

export interface GuidanceCopy {
  detail: string
  title: string
}

export function getAgentRuntimeGuidance(): GuidanceCopy {
  return {
    detail: 'Claude uses lifecycle hooks. The Codex row reports adapter health; the Codex mode section covers the full required setup.',
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
      'Use this page when you want the shortest path to a working Codex setup. Mycelium, Hyphae, Rhizome, Codex MCP, and Codex notify are required in the same flow; Claude lifecycle capture stays optional unless you also want Claude Code coverage.',
    title: 'Codex mode',
  }
}

export function getToolSettingsGuidance(): GuidanceCopy {
  return {
    detail: 'Settings tune installed tools. Use Status or Onboarding for host-adapter repair and install guidance.',
    title: 'Tool configuration',
  }
}
