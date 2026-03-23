import type { EcosystemStatus } from './api'

export type AllowedStipeAction =
  | 'doctor'
  | 'init'
  | 'install-claude-code'
  | 'install-full-stack'
  | 'install-minimal'

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
  'install-full-stack': ['install', '--profile', 'full-stack'],
  'install-minimal': ['install', '--profile', 'minimal'],
}

function hasCoreGap(status: EcosystemStatus): boolean {
  return !status.mycelium.available || !status.hyphae.available || !status.rhizome.available
}

function isHooksUnhealthy(status: EcosystemStatus): boolean {
  return status.hooks.installed_hooks.length === 0 || status.hooks.error_count > 0
}

function addAction(actions: OnboardingAction[], action: OnboardingAction) {
  if (!actions.some((candidate) => candidate.command === action.command)) {
    actions.push(action)
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

export function buildOnboardingActions(status: EcosystemStatus): OnboardingAction[] {
  const actions: OnboardingAction[] = []
  const coreGap = hasCoreGap(status)
  const hooksUnhealthy = isHooksUnhealthy(status)

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS.doctor.join(' ')}`,
    description: 'Check for setup drift, missing hooks, and local configuration problems.',
    label: 'Run stipe doctor',
    runAction: 'doctor',
    tier: hooksUnhealthy || coreGap ? 'primary' : 'secondary',
  })

  addAction(actions, {
    command: `stipe ${STIPE_COMMANDS.init.join(' ')}`,
    description: 'Bootstrap the ecosystem config and hook wiring on this machine.',
    label: 'Initialize the ecosystem',
    runAction: 'init',
    tier: hooksUnhealthy || coreGap ? 'primary' : 'secondary',
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
    description: 'Install the Claude Code-oriented profile for a local agent workflow.',
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

export function summarizeOnboarding(status: EcosystemStatus): string {
  const missing = [
    !status.mycelium.available ? 'Mycelium' : null,
    !status.hyphae.available ? 'Hyphae' : null,
    !status.rhizome.available ? 'Rhizome' : null,
  ].filter((item): item is string => item !== null)

  if (missing.length === 0 && !isHooksUnhealthy(status)) {
    return 'The core ecosystem is installed. Use the commands below for drift checks or optional profiles.'
  }

  const fragments: string[] = []

  if (missing.length > 0) {
    fragments.push(`Missing: ${missing.join(', ')}`)
  }

  if (status.hooks.installed_hooks.length === 0) {
    fragments.push('No hooks detected')
  } else if (status.hooks.error_count > 0) {
    fragments.push(`${status.hooks.error_count} hook errors`)
  }

  return fragments.join(' · ')
}
