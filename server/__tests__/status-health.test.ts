import { describe, expect, it } from 'vitest'

import type { EcosystemStatus } from '../../src/lib/api'
import { getClaudeLifecycleAdapterEmptyState } from '../../src/lib/host-guidance'
import { summarizeHookHealth } from '../../src/lib/status-health'

function createStatus(): EcosystemStatus {
  return {
    agents: {
      claude_code: {
        adapter: {
          configured: true,
          detected: true,
          kind: 'hooks',
          label: 'Claude lifecycle hooks',
        },
        config_path: '/Users/test/.claude/settings.json',
        configured: true,
        detected: true,
        integration: 'hooks',
        resolved_config_path: '/Users/test/.claude/settings.json',
        resolved_config_source: 'config_file',
      },
      codex: {
        adapter: {
          configured: false,
          detected: false,
          kind: 'mcp',
          label: 'Codex MCP',
        },
        config_path: null,
        configured: false,
        detected: false,
        integration: 'mcp',
        resolved_config_path: '/Users/test/.codex/config.toml',
        resolved_config_source: 'platform_default',
      },
    },
    hooks: {
      error_count: 0,
      installed_hooks: [],
      lifecycle: [
        { event: 'SessionStart', installed: false, matching_hooks: 0 },
        { event: 'PostToolUse', installed: false, matching_hooks: 0 },
        { event: 'PreCompact', installed: false, matching_hooks: 0 },
        { event: 'SessionEnd', installed: false, matching_hooks: 0 },
      ],
      recent_errors: [],
    },
    hyphae: {
      activity: {
        codex_memory_count: 0,
        last_codex_memory_at: null,
        last_session_memory_at: null,
        last_session_topic: null,
        recent_session_memory_count: 0,
      },
      available: false,
      memoirs: 0,
      memories: 0,
      version: null,
    },
    lsps: [],
    mycelium: { available: false, version: null },
    project: { active: '/projects/current', recent: ['/projects/current'] },
    rhizome: { available: false, backend: null, languages: [] },
  }
}

describe('status health copy', () => {
  it('explains why Claude lifecycle coverage is empty', () => {
    const status = createStatus()

    expect(getClaudeLifecycleAdapterEmptyState(status).detail).toContain('Open onboarding')
    expect(summarizeHookHealth(status).detail).toContain('Open onboarding')
    expect(summarizeHookHealth(status).label).toBe('Not configured')
  })

  it('explains why lifecycle coverage is partial when hooks are missing', () => {
    const status = createStatus()
    status.hooks.installed_hooks = [{ command: 'hyphae session-start', event: 'SessionStart', matcher: '.*' }]
    status.hooks.lifecycle = [
      { event: 'SessionStart', installed: true, matching_hooks: 1 },
      { event: 'PostToolUse', installed: false, matching_hooks: 0 },
      { event: 'PreCompact', installed: false, matching_hooks: 0 },
      { event: 'SessionEnd', installed: false, matching_hooks: 0 },
    ]

    const summary = summarizeHookHealth(status)

    expect(summary.label).toBe('Partial coverage')
    expect(summary.detail).toContain('Open onboarding')
    expect(summary.detail).toContain('PostToolUse')
  })
})
