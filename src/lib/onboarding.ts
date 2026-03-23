import type { EcosystemStatus, StipeDoctorCheck, StipeInitStep, StipeRepairAction, StipeRepairPlan } from './api'

export type AllowedStipeAction = 'doctor' | 'init' | 'install-claude-code' | 'install-codex' | 'install-full-stack' | 'install-minimal'

export interface OnboardingAction {
  command: string
  description: string
  label: string
  runAction?: AllowedStipeAction
  tier: 'manual' | 'primary' | 'secondary'
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
  return status.agents.codex.configured
}

function hasCodexDetected(status: EcosystemStatus): boolean {
  return status.agents.codex.detected || status.agents.codex.configured
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

function hasClaudeConfigured(status: EcosystemStatus): boolean {
  return status.agents.claude_code.configured
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
    description: 'Check for setup drift, missing hooks, and local configuration problems.',
    label: 'Run stipe doctor',
    runAction: 'doctor',
    tier: primaryRepair ? 'primary' : 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS.init.join(' ')}`,
    description: 'Bootstrap the ecosystem config and hook wiring on this machine.',
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
    command: `stipe ${STIPE_COMMANDS['install-claude-code'].join(' ')}`,
    description: 'Install the Claude Code-oriented profile when you want hook-based lifecycle capture.',
    label: 'Install the Claude Code profile',
    runAction: 'install-claude-code',
    tier: 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS['install-codex'].join(' ')}`,
    description: 'Install the Codex-oriented profile when you want MCP plus notify-based lifecycle capture.',
    label: 'Install the Codex profile',
    runAction: 'install-codex',
    tier: hasCodexDetected(status) && coreGap ? 'primary' : 'secondary',
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
      const codexSummary = summarizeCodexIntegration(status)

      if (codexSummary.label === 'Notify adapter') {
        return 'The core ecosystem is installed and Codex notify adapter coverage is configured. Use the commands below for drift checks, optional Claude hooks, or profile installs.'
      }

      if (codexSummary.label === 'MCP only') {
        return 'The core ecosystem is installed. Codex MCP is configured, but the notify adapter is still missing.'
      }

      if (codexSummary.label === 'Notify mismatch') {
        return 'The core ecosystem is installed. Codex notify is configured, but it does not match the expected adapter contract.'
      }

      return 'The core ecosystem is installed and Codex is configured. Use the commands below for drift checks, optional Claude hooks, or profile installs.'
    }

    return 'The core ecosystem is installed. Use the commands below for drift checks or optional profiles.'
  }

  const fragments: string[] = []

  if (missing.length > 0) {
    fragments.push(`Missing: ${missing.join(', ')}`)
  }

  if (hasClaudeConfigured(status) && status.hooks.installed_hooks.length === 0) {
    fragments.push('No hooks detected')
  } else if (hasClaudeConfigured(status) && status.hooks.error_count > 0) {
    fragments.push(`${status.hooks.error_count} hook errors`)
  }

  const missingLifecycle = missingLifecycleHooks(status)
  if (hasClaudeConfigured(status) && missingLifecycle.length > 0) {
    fragments.push(`Missing lifecycle hooks: ${missingLifecycle.join(', ')}`)
  }

  if (hasCodexConfigured(status)) {
    fragments.push(summarizeCodexIntegration(status).label)
  }

  return fragments.join(' · ')
}

export function failingDoctorChecks(repairPlan?: StipeRepairPlan): StipeDoctorCheck[] {
  return repairPlan?.doctor.checks.filter((check) => !check.passed) ?? []
}

export function initPlanSteps(repairPlan?: StipeRepairPlan): StipeInitStep[] {
  return repairPlan?.init_plan.steps ?? []
}
