import type { EcosystemStatus, StipeRepairPlan } from './api'
import type { CodexPresentationModel } from './codex'
import type { HyphaeMemoryFlowSummary } from './hyphae'
import type { OnboardingAction, OnboardingActionGroups } from './onboarding'
import { getCodexPresentationModel } from './codex'
import { summarizeHyphaeMemoryFlow } from './hyphae'
import { buildOnboardingActions, getOnboardingActionGroups, summarizeOnboarding } from './onboarding'

export interface EcosystemReadinessModel {
  actions: OnboardingAction[]
  codex: CodexPresentationModel
  groups: OnboardingActionGroups
  hyphaeFlow: HyphaeMemoryFlowSummary
  recommendedAction: OnboardingAction | null
  summary: string
}

export function getEcosystemReadinessModel(status: EcosystemStatus, repairPlan?: StipeRepairPlan): EcosystemReadinessModel {
  const actions = buildOnboardingActions(status, repairPlan)
  const groups = getOnboardingActionGroups(actions)

  return {
    actions,
    codex: getCodexPresentationModel(status),
    groups,
    hyphaeFlow: summarizeHyphaeMemoryFlow(status),
    recommendedAction: groups.primary[0] ?? groups.secondary[0] ?? groups.manual[0] ?? null,
    summary: summarizeOnboarding(status, repairPlan),
  }
}
