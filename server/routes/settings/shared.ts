import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { createCliRunner } from '../../lib/cli.ts'
import { HYPHAE_BIN } from '../../lib/config.ts'

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

export { runHyphae }
