import type { EcosystemStatus, StipeDoctorCheck, StipeInitStep, StipeRepairAction, StipeRepairPlan } from './api'

export type AllowedStipeAction = 'doctor' | 'init' | 'install-claude-code' | 'install-codex' | 'install-full-stack' | 'install-minimal'

export interface OnboardingAction {
  command: string
  description: string
  label: string
  runAction?: AllowedStipeAction
  tier: 'manual' | 'primary' | 'secondary'
}

export interface CodexModeSummary {
  color: string
  detail: string
  label: string
  optional: string[]
  ready: boolean
  required: string[]
}

const STIPE_COMMANDS: Record<AllowedStipeAction, string[]> = {
  doctor: ['doctor'],
  init: ['init'],
  'install-claude-code': ['install', '--profile', 'claude-code'],
  'install-codex': ['install', '--profile', 'codex'],
  'install-full-stack': ['install', '--profile', 'full-stack'],
  'install-minimal': ['install', '--profile', 'minimal'],
}

function hasCoreGap(status: EcosystemStatus): boolean {
  return !status.mycelium.available || !status.hyphae.available || !status.rhizome.available
}

function hasCodexConfigured(status: EcosystemStatus): boolean {
  return status.agents.codex.adapter.configured
}

function hasCodexDetected(status: EcosystemStatus): boolean {
  return status.agents.codex.adapter.detected || status.agents.codex.adapter.configured
}

export function summarizeCodexIntegration(status: EcosystemStatus): {
  color: string
  detail: string
  label: string
} {
  const { codex } = status.agents
  const notify = codex.notify

  if (!codex.configured) {
    return {
      color: 'gray',
      detail: 'No Codex config.toml was detected.',
      label: 'Not configured',
    }
  }

  if (!notify?.configured) {
    return {
      color: 'orange',
      detail: 'Codex MCP is configured, but notify = ["hyphae", "codex-notify"] is missing.',
      label: 'MCP only',
    }
  }

  if (!notify.contract_matched) {
    return {
      color: 'orange',
      detail: 'Codex notify is present, but it does not match notify = ["hyphae", "codex-notify"].',
      label: 'Notify mismatch',
    }
  }

  return {
    color: 'mycelium',
    detail: 'Codex MCP and the hyphae codex-notify adapter are configured.',
    label: 'Notify adapter',
  }
}

function codexRequiredSteps(status: EcosystemStatus): string[] {
  const required: string[] = []

  if (!status.mycelium.available) required.push('Mycelium')
  if (!status.hyphae.available) required.push('Hyphae')
  if (!status.rhizome.available) required.push('Rhizome')

  if (!status.agents.codex.adapter.configured) {
    required.push('Codex MCP profile')
  } else if (!status.agents.codex.notify?.configured) {
    required.push('hyphae codex-notify adapter')
  } else if (!status.agents.codex.notify.contract_matched) {
    required.push('Fix the Codex notify contract')
  }

  return required
}

function codexOptionalSteps(status: EcosystemStatus): string[] {
  if (!status.agents.claude_code.adapter.configured) {
    return ['Claude lifecycle hooks are optional unless you also want Claude Code coverage.']
  }

  if (isHooksUnhealthy(status)) {
    return ['Repair Claude lifecycle hooks if you also want Claude Code coverage.']
  }

  return ['Claude lifecycle hooks are available if you also want Claude Code coverage.']
}

export function summarizeCodexMode(status: EcosystemStatus): CodexModeSummary {
  const required = codexRequiredSteps(status)
  const optional = codexOptionalSteps(status)
  const codex = status.agents.codex

  if (!codex.configured) {
    return {
      color: 'gray',
      detail: 'Install the Codex profile and the hyphae notify adapter to make Codex mode usable.',
      label: 'Codex mode not configured',
      optional,
      ready: false,
      required,
    }
  }

  if (!codex.notify?.configured) {
    return {
      color: 'orange',
      detail: 'Codex MCP is configured, but the hyphae notify adapter is still missing.',
      label: 'Codex mode partial',
      optional,
      ready: false,
      required,
    }
  }

  if (!codex.notify.contract_matched) {
    return {
      color: 'orange',
      detail: 'Codex notify is present, but it does not match the expected notify = ["hyphae", "codex-notify"] contract.',
      label: 'Codex mode needs repair',
      optional,
      ready: false,
      required,
    }
  }

  if (required.length > 0) {
    return {
      color: 'orange',
      detail: `Codex mode is missing: ${required.join(', ')}. Claude lifecycle capture is optional.`,
      label: 'Codex mode partial',
      optional,
      ready: false,
      required,
    }
  }

  return {
    color: 'mycelium',
    detail: 'Codex MCP and the hyphae notify adapter are configured. Claude lifecycle capture is optional.',
    label: 'Codex mode ready',
    optional,
    ready: required.length === 0,
    required,
  }
}

function hasClaudeConfigured(status: EcosystemStatus): boolean {
  return status.agents.claude_code.adapter.configured
}

function isHooksUnhealthy(status: EcosystemStatus): boolean {
  if (!hasClaudeConfigured(status)) {
    return false
  }

  return status.hooks.installed_hooks.length === 0 || status.hooks.error_count > 0 || missingLifecycleHooks(status).length > 0
}

export function missingLifecycleHooks(status: EcosystemStatus): string[] {
  return status.hooks.lifecycle.filter((hook) => !hook.installed).map((hook) => hook.event)
}

function addAction(actions: OnboardingAction[], action: OnboardingAction) {
  if (!actions.some((candidate) => candidate.command === action.command)) {
    actions.push(action)
  }
}

function toRunAction(actionKey?: string | null): AllowedStipeAction | undefined {
  switch (actionKey) {
    case 'doctor':
    case 'init':
    case 'install-claude-code':
    case 'install-codex':
    case 'install-full-stack':
    case 'install-minimal':
      return actionKey
    default:
      return undefined
  }
}

function mapRepairAction(action: StipeRepairAction): OnboardingAction {
  return {
    command: action.command,
    description: action.description,
    label: action.label,
    runAction: toRunAction(action.action_key),
    tier: action.tier,
  }
}

function manualInstallAction(tool: 'hyphae' | 'mycelium' | 'rhizome'): OnboardingAction {
  const label = tool.charAt(0).toUpperCase() + tool.slice(1)

  return {
    command: `cargo install ${tool}`,
    description: `Install ${label} from crates.io.`,
    label: `Install ${label}`,
    tier: 'manual',
  }
}

function buildFallbackActions(status: EcosystemStatus): OnboardingAction[] {
  const actions: OnboardingAction[] = []
  const coreGap = hasCoreGap(status)
  const hooksUnhealthy = isHooksUnhealthy(status)
  const primaryRepair = coreGap || (hooksUnhealthy && !hasCodexConfigured(status))

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS.doctor.join(' ')}`,
    description: 'Check for setup drift, missing Codex requirements, and local configuration problems.',
    label: 'Run stipe doctor',
    runAction: 'doctor',
    tier: primaryRepair ? 'primary' : 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS.init.join(' ')}`,
    description: 'Bootstrap the ecosystem config and host adapter wiring on this machine.',
    label: 'Initialize the ecosystem',
    runAction: 'init',
    tier: primaryRepair ? 'primary' : 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS['install-minimal'].join(' ')}`,
    description: 'Install the smallest useful stack for local onboarding.',
    label: 'Install the minimal profile',
    runAction: 'install-minimal',
    tier: coreGap ? 'primary' : 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS['install-codex'].join(' ')}`,
    description: 'Install the Codex-oriented profile when you want MCP plus notify-based lifecycle capture.',
    label: 'Install the Codex profile',
    runAction: 'install-codex',
    tier: hasCodexDetected(status) && coreGap ? 'primary' : 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS['install-claude-code'].join(' ')}`,
    description: 'Install the Claude Code-oriented profile if you also want lifecycle hook capture.',
    label: 'Install the Claude Code profile',
    runAction: 'install-claude-code',
    tier: 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS['install-full-stack'].join(' ')}`,
    description: 'Install the broadest profile when you want every ecosystem tool available.',
    label: 'Install the full stack',
    runAction: 'install-full-stack',
    tier: 'secondary',
  })

  if (!status.mycelium.available) addAction(actions, manualInstallAction('mycelium'))
  if (!status.hyphae.available) addAction(actions, manualInstallAction('hyphae'))
  if (!status.rhizome.available) addAction(actions, manualInstallAction('rhizome'))

  return actions
}

export function buildOnboardingActions(status: EcosystemStatus, repairPlan?: StipeRepairPlan): OnboardingAction[] {
  const actions: OnboardingAction[] = []

  if (repairPlan) {
    for (const action of [...repairPlan.doctor.repair_actions, ...repairPlan.init_plan.repair_actions]) {
      addAction(actions, mapRepairAction(action))
    }
  }

  for (const action of buildFallbackActions(status)) {
    addAction(actions, action)
  }

  return actions
}

export function summarizeOnboarding(status: EcosystemStatus, repairPlan?: StipeRepairPlan): string {
  if (repairPlan && !repairPlan.doctor.healthy) {
    return repairPlan.doctor.summary
  }

  const missing = [
    !status.mycelium.available ? 'Mycelium' : null,
    !status.hyphae.available ? 'Hyphae' : null,
    !status.rhizome.available ? 'Rhizome' : null,
  ].filter((item): item is string => item !== null)

  if (missing.length === 0 && !isHooksUnhealthy(status)) {
    if (hasCodexConfigured(status)) {
      const codexMode = summarizeCodexMode(status)

      if (codexMode.ready) {
        return 'Codex mode is ready. Use the required steps below for drift checks and required tool installs; Claude lifecycle hooks stay optional unless you also use Claude Code.'
      }

      return `Codex mode is partially configured. ${codexMode.detail}`
    }

    return 'The core ecosystem is installed. Use the commands below for drift checks or optional profiles.'
  }

  const fragments: string[] = []

  if (missing.length > 0) {
    fragments.push(`Missing: ${missing.join(', ')}`)
  }

  if (hasClaudeConfigured(status) && status.hooks.installed_hooks.length === 0) {
    fragments.push('No Claude lifecycle adapter detected')
  } else if (hasClaudeConfigured(status) && status.hooks.error_count > 0) {
    fragments.push(`${status.hooks.error_count} lifecycle errors`)
  }

  const missingLifecycle = missingLifecycleHooks(status)
  if (hasClaudeConfigured(status) && missingLifecycle.length > 0) {
    fragments.push(`Missing lifecycle events: ${missingLifecycle.join(', ')}`)
  }

  if (hasCodexConfigured(status)) {
    fragments.push(summarizeCodexMode(status).label)
  }

  return fragments.join(' · ')
}

export function failingDoctorChecks(repairPlan?: StipeRepairPlan): StipeDoctorCheck[] {
  return repairPlan?.doctor.checks.filter((check) => !check.passed) ?? []
}

export function initPlanSteps(repairPlan?: StipeRepairPlan): StipeInitStep[] {
  return repairPlan?.init_plan.steps ?? []
}
