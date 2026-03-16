import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { logger } from '../logger.ts'

const exec = promisify(execFile)

export function createCliRunner(bin: string, label: string) {
  return async function runCli(args: string[]): Promise<string> {
    logger.debug({ args, bin }, `Executing ${label} CLI`)
    const { stdout } = await exec(bin, args, {
      env: { ...process.env, NO_COLOR: '1' },
      timeout: 10_000,
    })
    return stdout.trim()
  }
}
