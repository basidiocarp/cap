import { describe, expect, it } from 'vitest'

import type { CodexNotifyStatus, EcosystemStatus, StipeRepairPlan } from '../../src/lib/api'
import { getCodexModeSteps, summarizeCodexAdapter, summarizeCodexMode } from '../../src/lib/codex'
import { summarizeHyphaeMemoryFlow } from '../../src/lib/hyphae'
import { buildOnboardingActions, getOnboardingActionGroups, missingLifecycleHooks, summarizeOnboarding } from '../../src/lib/onboarding'
import { getEcosystemReadinessModel } from '../../src/lib/readiness'
import { buildStipeArgs, parseStipeAction } from '../routes/settings'

function createMissingStatus(): EcosystemStatus {
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

function createCodexStatus(notify: CodexNotifyStatus): EcosystemStatus {
  const status = createMissingStatus()

  return {
    ...status,
    agents: {
      ...status.agents,
      claude_code: {
        ...status.agents.claude_code,
        adapter: {
          ...status.agents.claude_code.adapter,
          configured: false,
          detected: false,
        },
        config_path: null,
        configured: false,
        detected: false,
      },
      codex: {
        ...status.agents.codex,
        adapter: {
          ...status.agents.codex.adapter,
          configured: true,
          detected: true,
        },
        config_path: '/Users/test/.codex/config.toml',
        configured: true,
        detected: true,
        notify,
      },
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
    expect(commands).toContain('stipe install --profile codex')
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
    expect(summarizeOnboarding(status)).toContain('Missing lifecycle events')
  })

  it('distinguishes Codex adapter health from full mode readiness', () => {
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

    expect(summarizeCodexAdapter(mcpOnly)).toMatchObject({ label: 'MCP only' })
    expect(summarizeOnboarding(mcpOnly)).toContain('Codex partial')

    expect(summarizeCodexAdapter(adapter)).toMatchObject({ label: 'Notify adapter' })
    expect(summarizeOnboarding(adapter)).toContain('Codex ready')
  })

  it('summarizes Codex mode with required steps and optional Claude coverage', () => {
    const status = createCodexStatus({
      command: 'hyphae codex-notify',
      config_path: '/Users/test/.codex/config.toml',
      configured: true,
      contract_matched: true,
    })
    const steps = getCodexModeSteps(status)

    expect(summarizeCodexMode(status)).toMatchObject({
      label: 'Codex ready',
      ready: true,
      required: [],
    })
    expect(summarizeCodexMode(status).detail).toContain('Mycelium')
    expect(steps.find((step) => step.label === 'Claude hooks')).toMatchObject({
      group: 'optional',
      status: 'optional',
    })
  })

  it('summarizes Codex mode as partial when notify coverage is missing', () => {
    const status = createCodexStatus({
      command: null,
      config_path: '/Users/test/.codex/config.toml',
      configured: false,
      contract_matched: false,
    })

    expect(summarizeCodexMode(status)).toMatchObject({
      label: 'Codex partial',
      ready: false,
    })
    expect(summarizeCodexMode(status).required).toContain('Codex notify')
  })

  it('reports when Codex and Claude are both ready together', () => {
    const status = createCodexStatus({
      command: 'hyphae codex-notify',
      config_path: '/Users/test/.codex/config.toml',
      configured: true,
      contract_matched: true,
    })
    status.agents.claude_code = {
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
    }
    status.hooks = {
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
    }

    expect(summarizeCodexMode(status)).toMatchObject({
      label: 'Codex + Claude ready',
      ready: true,
    })
  })

  it('keeps Mycelium in the required Codex flow', () => {
    const status = {
      ...createCodexStatus({
        command: 'hyphae codex-notify',
        config_path: '/Users/test/.codex/config.toml',
        configured: true,
        contract_matched: true,
      }),
      mycelium: {
        available: false,
        version: null,
      },
    }

    const steps = getCodexModeSteps(status)
    const myceliumStep = steps.find((step) => step.label === 'Mycelium')

    expect(myceliumStep).toMatchObject({
      group: 'required',
      status: 'required',
    })
    expect(summarizeCodexMode(status).required[0]).toBe('Mycelium')
  })

  it('groups optional Claude actions using explicit metadata', () => {
    const actions = buildOnboardingActions(
      createCodexStatus({
        command: 'hyphae codex-notify',
        config_path: '/Users/test/.codex/config.toml',
        configured: true,
        contract_matched: true,
      })
    )
    const groups = getOnboardingActionGroups(actions)

    expect(groups.optionalClaude.every((action) => action.scope === 'claude-optional')).toBe(true)
    expect(groups.optionalCore.every((action) => action.scope !== 'claude-optional')).toBe(true)
    expect(groups.secondary.some((action) => action.scope === 'claude-optional')).toBe(true)
  })

  it('reports when Codex memory flow is still waiting for a first turn', () => {
    const status = createCodexStatus({
      command: 'hyphae codex-notify',
      config_path: '/Users/test/.codex/config.toml',
      configured: true,
      contract_matched: true,
    })

    expect(summarizeHyphaeMemoryFlow(status)).toMatchObject({
      label: 'No Codex memories yet',
      recommendation: 'Complete one real Codex turn, then refresh this page to confirm end-to-end flow.',
    })
  })

  it('reports Codex memory flow once a Codex memory is present', () => {
    const status = createCodexStatus({
      command: 'hyphae codex-notify',
      config_path: '/Users/test/.codex/config.toml',
      configured: true,
      contract_matched: true,
    })
    status.hyphae.activity = {
      codex_memory_count: 2,
      last_codex_memory_at: '2026-03-24T10:00:00Z',
      last_session_memory_at: '2026-03-24T10:00:00Z',
      last_session_topic: 'session/my-project',
      recent_session_memory_count: 3,
    }

    expect(summarizeHyphaeMemoryFlow(status)).toMatchObject({
      label: 'Flowing',
      recommendation: 'Open Memories to inspect the latest Codex session entries.',
    })
  })

  it('builds a shared readiness model for status and onboarding views', () => {
    const readiness = getEcosystemReadinessModel(
      createCodexStatus({
        command: 'hyphae codex-notify',
        config_path: '/Users/test/.codex/config.toml',
        configured: true,
        contract_matched: true,
      }),
      createRepairPlan()
    )

    expect(readiness.summary).toBe('1 checks need attention.')
    expect(readiness.codex.mode.label).toBe('Codex ready')
    expect(readiness.hyphaeFlow.label).toBe('No Codex memories yet')
    expect(readiness.recommendedAction?.command).toBe('stipe init')
    expect(readiness.groups.primary[0]?.command).toBe('stipe init')
    expect(readiness.recommendedQuickActions[0]).toMatchObject({ kind: 'run', runAction: 'init' })
    expect(readiness.hyphaeQuickActions[0]).toMatchObject({ kind: 'refresh', label: 'Refresh status' })
  })
})
