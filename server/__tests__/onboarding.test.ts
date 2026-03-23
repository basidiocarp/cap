import { describe, expect, it } from 'vitest'

import type { CodexNotifyStatus, EcosystemStatus, StipeRepairPlan } from '../../src/lib/api'
import { buildOnboardingActions, missingLifecycleHooks, summarizeCodexIntegration, summarizeOnboarding } from '../../src/lib/onboarding'
import { buildStipeArgs, parseStipeAction } from '../routes/settings'

function createMissingStatus(): EcosystemStatus {
  return {
    agents: {
      claude_code: {
        config_path: '/Users/test/.claude/settings.json',
        configured: true,
        detected: true,
        integration: 'hooks',
      },
      codex: {
        config_path: null,
        configured: false,
        detected: false,
        integration: 'mcp',
      },
    },
    hooks: {
      error_count: 1,
      installed_hooks: [],
      lifecycle: [
        { event: 'SessionStart', installed: false, matching_hooks: 0 },
        { event: 'PostToolUse', installed: false, matching_hooks: 0 },
        { event: 'PreCompact', installed: false, matching_hooks: 0 },
        { event: 'SessionEnd', installed: false, matching_hooks: 0 },
      ],
      recent_errors: [],
    },
    hyphae: { available: false, memoirs: 0, memories: 0, version: null },
    lsps: [],
    mycelium: { available: false, version: null },
    project: { active: '/projects/current', recent: ['/projects/current'] },
    rhizome: { available: false, backend: null, languages: [] },
  }
}

function createCodexStatus(notify: CodexNotifyStatus): EcosystemStatus {
  const status = createMissingStatus()

  return {
    ...status,
    agents: {
      ...status.agents,
      claude_code: {
        ...status.agents.claude_code,
        config_path: null,
        configured: false,
        detected: false,
      },
      codex: {
        ...status.agents.codex,
        config_path: '/Users/test/.codex/config.toml',
        configured: true,
        detected: true,
        notify,
      },
    },
    hyphae: { available: true, memoirs: 0, memories: 0, version: null },
    mycelium: { available: true, version: null },
    rhizome: { available: true, backend: 'tree-sitter', languages: [] },
  }
}

function createRepairPlan(): StipeRepairPlan {
  return {
    doctor: {
      checks: [
        {
          message: 'Database not found',
          name: 'hyphae database',
          passed: false,
          repair_actions: [
            {
              action_key: 'init',
              args: ['init'],
              command: 'stipe init',
              description: 'Initialize the ecosystem.',
              label: 'Initialize the ecosystem',
              tier: 'primary',
            },
          ],
        },
      ],
      healthy: false,
      repair_actions: [
        {
          action_key: 'init',
          args: ['init'],
          command: 'stipe init',
          description: 'Initialize the ecosystem.',
          label: 'Initialize the ecosystem',
          tier: 'primary',
        },
      ],
      summary: '1 checks need attention.',
    },
    init_plan: {
      detected_clients: ['Cursor'],
      dry_run: true,
      repair_actions: [
        {
          action_key: 'install-claude-code',
          args: ['install', '--profile', 'claude-code'],
          command: 'stipe install --profile claude-code',
          description: 'Install the core local stack.',
          label: 'Install the Claude Code profile',
          tier: 'primary',
        },
      ],
      steps: [
        {
          detail: 'Detected: Cursor',
          status: 'planned',
          title: 'configure detected MCP clients',
        },
      ],
      target_client: null,
    },
  }
}

describe('onboarding helpers', () => {
  it('builds onboarding actions from a missing ecosystem status', () => {
    const actions = buildOnboardingActions(createMissingStatus())
    const commands = actions.map((action) => action.command)

    expect(commands).toContain('stipe install --profile minimal')
    expect(commands).toContain('stipe doctor')
    expect(commands).toContain('stipe init')
    expect(commands).toContain('cargo install mycelium')
    expect(commands).toContain('cargo install hyphae')
    expect(commands).toContain('cargo install rhizome')
  })

  it('accepts only allowlisted stipe actions', () => {
    expect(parseStipeAction('doctor')).toBe('doctor')
    expect(parseStipeAction('install-claude-code')).toBe('install-claude-code')
    expect(parseStipeAction('install-codex')).toBe('install-codex')
    expect(parseStipeAction('rm -rf /')).toBeNull()
  })

  it('maps allowlisted stipe actions to fixed argument lists', () => {
    expect(buildStipeArgs('install-full-stack')).toEqual(['install', '--profile', 'full-stack'])
    expect(buildStipeArgs('install-codex')).toEqual(['install', '--profile', 'codex'])
  })

  it('prefers structured stipe repair actions when they are available', () => {
    const actions = buildOnboardingActions(createMissingStatus(), createRepairPlan())
    const commands = actions.map((action) => action.command)

    expect(commands[0]).toBe('stipe init')
    expect(commands).toContain('stipe install --profile claude-code')
  })

  it('surfaces the codex install profile when Codex is present', () => {
    const actions = buildOnboardingActions(
      createCodexStatus({
        command: null,
        config_path: '/Users/test/.codex/config.toml',
        configured: false,
        contract_matched: false,
      })
    )

    expect(actions.map((action) => action.command)).toContain('stipe install --profile codex')
  })

  it('reports missing lifecycle hooks in onboarding summaries', () => {
    const status = createMissingStatus()

    expect(missingLifecycleHooks(status)).toEqual(['SessionStart', 'PostToolUse', 'PreCompact', 'SessionEnd'])
    expect(summarizeOnboarding(status)).toContain('Missing lifecycle hooks')
  })

  it('distinguishes Codex MCP-only presence from notify adapter coverage', () => {
    const mcpOnly = createCodexStatus({
      command: null,
      config_path: '/Users/test/.codex/config.toml',
      configured: false,
      contract_matched: false,
    })
    const adapter = createCodexStatus({
      command: 'hyphae codex-notify',
      config_path: '/Users/test/.codex/config.toml',
      configured: true,
      contract_matched: true,
    })

    expect(summarizeCodexIntegration(mcpOnly)).toMatchObject({
      label: 'MCP only',
    })
    expect(summarizeOnboarding(mcpOnly)).toContain('Codex MCP is configured')

    expect(summarizeCodexIntegration(adapter)).toMatchObject({
      label: 'Notify adapter',
    })
    expect(summarizeOnboarding(adapter)).toContain('Codex notify adapter coverage is configured')
  })
})
