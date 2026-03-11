import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { logger } from './logger.ts'

const exec = promisify(execFile)

const MYCELIUM_BIN = process.env.MYCELIUM_BIN ?? 'mycelium'

async function run(args: string[]): Promise<string> {
  logger.debug({ args, bin: MYCELIUM_BIN }, 'Executing mycelium CLI')
  const { stdout } = await exec(MYCELIUM_BIN, args, {
    timeout: 10_000,
    env: { ...process.env, NO_COLOR: '1' },
  })
  return stdout.trim()
}

export async function getGain(format: 'json' | 'text' = 'json') {
  const raw = await run(['gain', '--format', format])
  if (format === 'json') {
    return JSON.parse(raw)
  }
  return { raw }
}

export async function getGainHistory(format: 'json' | 'text' = 'json') {
  const raw = await run(['gain', '--history', '--format', format])
  if (format === 'json') {
    return JSON.parse(raw)
  }
  return { raw }
}
