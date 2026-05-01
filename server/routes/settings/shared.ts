import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { createCliRunner } from '../../lib/cli.ts'
import { HYPHAE_BIN } from '../../lib/config.ts'
import { callLocalService } from '../../lib/local-service.ts'
import { logger } from '../../logger.ts'

const runHyphae = createCliRunner(HYPHAE_BIN, 'hyphae')
const exec = promisify(execFile)

const STIPE_ACTIONS = {
  doctor: ['doctor'],
  init: ['init'],
  'install-claude-code': ['install', '--profile', 'claude-code'],
  'install-codex': ['install', '--profile', 'codex'],
  'install-full-stack': ['install', '--profile', 'full-stack'],
  'install-minimal': ['install', '--profile', 'minimal'],
} as const

const STIPE_DOCTOR_SCHEMA_VERSION = '1.0'
const STIPE_INIT_PLAN_SCHEMA_VERSION = '1.0'

export type AllowedStipeAction = keyof typeof STIPE_ACTIONS

export function parseStipeAction(action: string): AllowedStipeAction | null {
  return action in STIPE_ACTIONS ? (action as AllowedStipeAction) : null
}

export function buildStipeArgs(action: AllowedStipeAction): string[] {
  return [...STIPE_ACTIONS[action]]
}

export async function runStipe(args: string[]): Promise<string> {
  const { stdout } = await exec('stipe', args, {
    env: { ...process.env, NO_COLOR: '1' },
    timeout: 30_000,
  })
  return stdout.trim()
}

export async function runStipeJson<T>(args: string[]): Promise<T> {
  const output = await runStipe([...args, '--json'])
  return JSON.parse(output) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isRepairAction(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.command === 'string' &&
    (typeof value.description === 'string' || value.description === null) &&
    typeof value.label === 'string' &&
    Array.isArray(value.args) &&
    typeof value.tier === 'string'
  )
}

function isInitPlanRepairAction(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (typeof value.action_key !== 'string') return false
  if (typeof value.command !== 'string') return false
  if (typeof value.label !== 'string') return false
  if (value.args !== undefined && !Array.isArray(value.args)) return false
  if (value.tier !== undefined && typeof value.tier !== 'string') return false
  if (value.description !== undefined && value.description !== null && typeof value.description !== 'string') {
    return false
  }
  return true
}

function isDoctorCheck(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    (typeof value.message === 'string' || value.message === null) &&
    typeof value.passed === 'boolean' &&
    (value.repair_actions === undefined || (Array.isArray(value.repair_actions) && value.repair_actions.every(isRepairAction)))
  )
}

function isStipeDoctorReport(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.schema_version === STIPE_DOCTOR_SCHEMA_VERSION &&
    typeof value.healthy === 'boolean' &&
    typeof value.summary === 'string' &&
    Array.isArray(value.checks) &&
    value.checks.every(isDoctorCheck) &&
    Array.isArray(value.repair_actions) &&
    value.repair_actions.every(isRepairAction)
  )
}

function isInitStep(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.title === 'string' &&
    (typeof value.detail === 'string' || value.detail === null || value.detail === undefined) &&
    typeof value.status === 'string'
  )
}

function isStipeInitPlan(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.schema_version === STIPE_INIT_PLAN_SCHEMA_VERSION &&
    typeof value.dry_run === 'boolean' &&
    Array.isArray(value.selected_hosts) &&
    Array.isArray(value.detected_hosts) &&
    Array.isArray(value.detected_clients) &&
    Array.isArray(value.steps) &&
    value.steps.every(isInitStep) &&
    Array.isArray(value.repair_actions) &&
    value.repair_actions.every(isInitPlanRepairAction)
  )
}

export function parseStipeDoctorReport(raw: string): unknown {
  const parsed = JSON.parse(raw) as unknown
  if (!isStipeDoctorReport(parsed)) {
    throw new Error('Invalid stipe doctor payload')
  }
  return parsed
}

export function parseStipeInitPlan(raw: string): unknown {
  const parsed = JSON.parse(raw) as unknown
  if (!isStipeInitPlan(parsed)) {
    throw new Error('Invalid stipe init plan payload')
  }
  return parsed
}

export async function runStipeDoctorReport<T = unknown>(): Promise<T> {
  try {
    const result = await callLocalService('stipe', 'stipe_doctor', {})
    if (result) return parseStipeDoctorReport(result) as T
  } catch (err) {
    logger.debug({ err }, 'stipe socket unavailable for doctor, falling back to CLI')
  }
  const output = await runStipe(['doctor', '--json'])
  return parseStipeDoctorReport(output) as T
}

export async function runStipeInitPlan<T = unknown>(): Promise<T> {
  try {
    const result = await callLocalService('stipe', 'stipe_init_plan', {})
    if (result) return parseStipeInitPlan(result) as T
  } catch (err) {
    logger.debug({ err }, 'stipe socket unavailable for init plan, falling back to CLI')
  }
  const output = await runStipe(['init', '--dry-run', '--json'])
  return parseStipeInitPlan(output) as T
}

export { runHyphae }
