import type { EcosystemStatus, StipeRepairPlan } from './api'
import type { CodexPresentationModel } from './codex'
import type { HyphaeMemoryFlowSummary } from './hyphae'
import type { OnboardingAction, OnboardingActionGroups } from './onboarding'
import { getCodexPresentationModel } from './codex'
import { summarizeHyphaeMemoryFlow } from './hyphae'
import { buildOnboardingActions, getOnboardingActionGroups, summarizeOnboarding } from './onboarding'

export type { HostCoverageMode, HostCoverageView } from './host-coverage-view'
export { getHostCoverageView, resolveHostCoverageMode } from './host-coverage-view'

export interface EcosystemReadinessModel {
  actions: OnboardingAction[]
  codex: CodexPresentationModel
  groups: OnboardingActionGroups
  hyphaeFlow: HyphaeMemoryFlowSummary
  hyphaeQuickActions: ReadinessQuickAction[]
  recommendedAction: OnboardingAction | null
  recommendedQuickActions: ReadinessQuickAction[]
  summary: string
}

export interface ReadinessQuickAction {
  href?: string
  kind: 'link' | 'refresh' | 'run'
  label: string
  runAction?: OnboardingAction['runAction']
  variant?: 'light' | 'subtle'
}

export type ReadinessTool = 'hyphae' | 'mycelium' | 'rhizome'

function buildRecommendedQuickActions(recommendedAction: OnboardingAction | null): ReadinessQuickAction[] {
  const actions: ReadinessQuickAction[] = []

  if (recommendedAction?.runAction) {
    actions.push({
      kind: 'run',
      label: 'Run recommended step',
      runAction: recommendedAction.runAction,
      variant: 'light',
    })
  }

  actions.push({
    href: '/onboard',
    kind: 'link',
    label: 'Open onboarding',
    variant: recommendedAction?.runAction ? 'subtle' : 'light',
  })

  return actions
}

function buildHyphaeQuickActions(summary: HyphaeMemoryFlowSummary, fallbackAction?: OnboardingAction['runAction']): ReadinessQuickAction[] {
  if (summary.label === 'Flowing') {
    return [
      { href: '/memories', kind: 'link', label: 'Open memories', variant: 'subtle' },
      { kind: 'refresh', label: 'Refresh status', variant: 'subtle' },
    ]
  }

  if (summary.label === 'No Codex memories yet') {
    return [
      { kind: 'refresh', label: 'Refresh status', variant: 'light' },
      { href: '/memories', kind: 'link', label: 'Open memories', variant: 'subtle' },
    ]
  }

  const actions: ReadinessQuickAction[] = []

  if (fallbackAction) {
    actions.push({
      kind: 'run',
      label: 'Run repair step',
      runAction: fallbackAction,
      variant: 'light',
    })
  }

  actions.push({
    kind: 'refresh',
    label: 'Refresh status',
    variant: actions.length === 0 ? 'light' : 'subtle',
  })

  return actions
}

export function getEcosystemReadinessModel(status: EcosystemStatus, repairPlan?: StipeRepairPlan): EcosystemReadinessModel {
  const actions = buildOnboardingActions(status, repairPlan)
  const groups = getOnboardingActionGroups(actions)
  const recommendedAction = groups.primary[0] ?? groups.secondary[0] ?? groups.manual[0] ?? null
  const hyphaeFlow = summarizeHyphaeMemoryFlow(status)

  return {
    actions,
    codex: getCodexPresentationModel(status),
    groups,
    hyphaeFlow,
    hyphaeQuickActions: buildHyphaeQuickActions(hyphaeFlow, recommendedAction?.runAction),
    recommendedAction,
    recommendedQuickActions: buildRecommendedQuickActions(recommendedAction),
    summary: summarizeOnboarding(status, repairPlan),
  }
}

export function getToolQuickActions(
  tool: ReadinessTool,
  readiness: EcosystemReadinessModel,
  status: EcosystemStatus
): ReadinessQuickAction[] {
  switch (tool) {
    case 'hyphae':
      return readiness.hyphaeQuickActions
    case 'rhizome':
      return status.rhizome.available
        ? [{ href: '/code', kind: 'link', label: 'Open code explorer', variant: 'subtle' }]
        : readiness.recommendedQuickActions
    case 'mycelium':
      return status.mycelium.available ? [] : readiness.recommendedQuickActions
    default:
      return []
  }
}
