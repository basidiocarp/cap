import type { EcosystemStatus, StipeDoctorCheck, StipeInitStep, StipeRepairAction, StipeRepairPlan } from './api'
import { getCodexPresentationModel, isClaudeHooksUnhealthy, missingLifecycleHooks } from './codex'

export { missingLifecycleHooks } from './codex'

export type AllowedStipeAction = 'doctor' | 'init' | 'install-claude-code' | 'install-codex' | 'install-full-stack' | 'install-minimal'

export interface OnboardingAction {
  command: string
  description: string
  label: string
  runAction?: AllowedStipeAction
  scope: 'claude-optional' | 'core'
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

function hasClaudeConfigured(status: EcosystemStatus): boolean {
  return status.agents.claude_code.adapter.configured
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

export interface OnboardingActionGroups {
  manual: OnboardingAction[]
  optionalClaude: OnboardingAction[]
  optionalCore: OnboardingAction[]
  primary: OnboardingAction[]
  secondary: OnboardingAction[]
}

export function getOnboardingActionGroups(actions: OnboardingAction[]): OnboardingActionGroups {
  return {
    manual: actions.filter((action) => action.tier === 'manual'),
    optionalClaude: actions.filter((action) => action.scope === 'claude-optional'),
    optionalCore: actions.filter((action) => action.scope !== 'claude-optional' && action.tier === 'secondary'),
    primary: actions.filter((action) => action.tier === 'primary'),
    secondary: actions.filter((action) => action.tier === 'secondary'),
  }
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
    scope: action.action_key === 'install-claude-code' ? 'claude-optional' : 'core',
    tier: action.tier,
  }
}

function manualInstallAction(tool: 'hyphae' | 'mycelium' | 'rhizome'): OnboardingAction {
  const label = tool.charAt(0).toUpperCase() + tool.slice(1)

  return {
    command: `cargo install ${tool}`,
    description: `Install ${label} from crates.io.`,
    label: `Install ${label}`,
    scope: 'core',
    tier: 'manual',
  }
}

function buildFallbackActions(status: EcosystemStatus): OnboardingAction[] {
  const actions: OnboardingAction[] = []
  const coreGap = hasCoreGap(status)
  const hooksUnhealthy = isClaudeHooksUnhealthy(status)
  const primaryRepair = coreGap || (hooksUnhealthy && !hasCodexConfigured(status))

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS.doctor.join(' ')}`,
    description: 'Check for setup drift, missing Codex requirements, and local configuration problems.',
    label: 'Run stipe doctor',
    runAction: 'doctor',
    scope: 'core',
    tier: primaryRepair ? 'primary' : 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS.init.join(' ')}`,
    description: 'Bootstrap the ecosystem config and host adapter wiring on this machine.',
    label: 'Initialize the ecosystem',
    runAction: 'init',
    scope: 'core',
    tier: primaryRepair ? 'primary' : 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS['install-minimal'].join(' ')}`,
    description: 'Install the smallest useful stack for local onboarding.',
    label: 'Install the minimal profile',
    runAction: 'install-minimal',
    scope: 'core',
    tier: coreGap ? 'primary' : 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS['install-codex'].join(' ')}`,
    description: 'Install the Codex-oriented profile when you want MCP plus notify-based lifecycle capture.',
    label: 'Install the Codex profile',
    runAction: 'install-codex',
    scope: 'core',
    tier: hasCodexDetected(status) && coreGap ? 'primary' : 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS['install-claude-code'].join(' ')}`,
    description: 'Install the Claude Code-oriented profile if you also want lifecycle hook capture.',
    label: 'Install the Claude Code profile',
    runAction: 'install-claude-code',
    scope: 'claude-optional',
    tier: 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS['install-full-stack'].join(' ')}`,
    description: 'Install the broadest profile when you want every ecosystem tool available.',
    label: 'Install the full stack',
    runAction: 'install-full-stack',
    scope: 'core',
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

  const codex = status.agents.codex.adapter.configured ? getCodexPresentationModel(status) : null

  if (missing.length === 0 && !isClaudeHooksUnhealthy(status)) {
    if (codex) {
      if (codex.mode.ready) {
        return `${codex.mode.label}. Use the required steps below for drift checks and tool installs; Claude and Codex can both use the ecosystem at the same time when both adapters are healthy.`
      }

      return `${codex.mode.label}. ${codex.mode.detail}`
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

  if (codex) {
    fragments.push(codex.mode.label)
  }

  return fragments.join(' · ')
}

export function failingDoctorChecks(repairPlan?: StipeRepairPlan): StipeDoctorCheck[] {
  return repairPlan?.doctor.checks.filter((check) => !check.passed) ?? []
}

export function initPlanSteps(repairPlan?: StipeRepairPlan): StipeInitStep[] {
  return repairPlan?.init_plan.steps ?? []
}
