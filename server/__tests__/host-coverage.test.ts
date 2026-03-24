import { beforeEach, describe, expect, it } from 'vitest'

import type { EcosystemStatus } from '../../src/lib/api'
import { getHostCoverageView, resolveHostCoverageMode } from '../../src/lib/readiness'
import { summarizeHostCoverage, useHostCoverageStore } from '../../src/store/host-coverage'

function createStatus(): EcosystemStatus {
  return {
    agents: {
      claude_code: {
        adapter: { configured: true, detected: true, kind: 'hooks', label: 'Claude lifecycle hooks' },
        config_path: '/Users/test/.claude/settings.json',
        configured: true,
        detected: true,
        integration: 'hooks',
      },
      codex: {
        adapter: { configured: true, detected: true, kind: 'mcp', label: 'Codex MCP' },
        config_path: '/Users/test/.codex/config.toml',
        configured: true,
        detected: true,
        integration: 'mcp',
        notify: { command: null, config_path: '/Users/test/.codex/config.toml', configured: true, contract_matched: true },
      },
    },
    hooks: {
      error_count: 0,
      installed_hooks: [
        { command: 'hyphae session-start', event: 'SessionStart', matcher: '.*' },
        { command: 'hyphae post-tool', event: 'PostToolUse', matcher: '.*' },
        { command: 'hyphae precompact', event: 'PreCompact', matcher: '.*' },
        { command: 'hyphae session-end', event: 'SessionEnd', matcher: '.*' },
      ],
      lifecycle: [
        { event: 'SessionStart', installed: true, matching_hooks: 1 },
        { event: 'PostToolUse', installed: true, matching_hooks: 1 },
        { event: 'PreCompact', installed: true, matching_hooks: 1 },
        { event: 'SessionEnd', installed: true, matching_hooks: 1 },
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
      available: true,
      memoirs: 0,
      memories: 0,
      version: null,
    },
    lsps: [],
    mycelium: { available: true, version: null },
    project: { active: '/projects/current', recent: ['/projects/current'] },
    rhizome: { available: true, backend: 'tree-sitter', languages: [] },
  }
}

describe('host coverage', () => {
  beforeEach(() => {
    useHostCoverageStore.getState().resetMode()
  })

  it('defaults to auto mode', () => {
    expect(useHostCoverageStore.getState().mode).toBe('auto')
  })

  it('updates the selected mode', () => {
    useHostCoverageStore.getState().setMode('both')

    expect(useHostCoverageStore.getState().mode).toBe('both')
  })

  it('resolves auto mode to shared coverage when both runtimes are healthy', () => {
    expect(resolveHostCoverageMode(createStatus(), 'auto')).toBe('both')
  })

  it('uses the selected preference for runtime ordering and copy', () => {
    const view = getHostCoverageView(createStatus(), 'claude')

    expect(view.label).toBe('Claude-first')
    expect(view.requiredSectionTitle).toBe('Required for shared coverage')
    expect(view.runtimeOrder).toEqual(['claude-code', 'codex'])
    expect(view.usageNote).toContain('Claude-first lens')
  })

  it('summarizes codex-first mode explicitly', () => {
    const summary = summarizeHostCoverage('codex', createStatus())

    expect(summary.label).toBe('Codex-first')
    expect(summary.detail).toContain('Codex-first view')
  })
})
