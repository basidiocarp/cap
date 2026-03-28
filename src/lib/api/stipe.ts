import type { AllowedStipeAction } from '../onboarding'
import { get, post } from './http'

export interface StipeRunResult {
  action: AllowedStipeAction
  command: string
  output: string
}

export interface StipeRepairAction {
  action_key?: string | null
  args: string[]
  command: string
  description: string
  label: string
  tier: 'manual' | 'primary' | 'secondary'
}

export interface StipeDoctorCheck {
  message: string
  name: string
  passed: boolean
  repair_actions?: StipeRepairAction[]
}

export interface StipeDoctorReport {
  checks: StipeDoctorCheck[]
  healthy: boolean
  repair_actions: StipeRepairAction[]
  summary: string
}

export interface StipeInitStep {
  detail: string
  status: 'already-ok' | 'planned' | 'skipped'
  title: string
}

export interface StipeInitPlan {
  detected_clients: string[]
  dry_run: boolean
  repair_actions: StipeRepairAction[]
  steps: StipeInitStep[]
  target_client?: string | null
}

export interface StipeRepairPlan {
  doctor: StipeDoctorReport
  init_plan: StipeInitPlan
}

export const stipeApi = {
  repairPlan: () => get<StipeRepairPlan>('/settings/stipe/repair-plan'),
  run: (action: AllowedStipeAction) => post<StipeRunResult>('/settings/stipe/run', { action }),
}
