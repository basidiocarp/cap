import type { GainCliOutput } from './types.ts'
import { createCliRunner } from '../lib/cli.ts'
import { MYCELIUM_BIN } from '../lib/config.ts'

const run = createCliRunner(MYCELIUM_BIN, 'mycelium')

export function parseGainOutput(raw: unknown): GainCliOutput {
  if (raw && typeof raw === 'object') return raw as GainCliOutput
  return {}
}

export async function getGain(format: 'json' | 'text' = 'json') {
  const raw = await run(['gain', '--format', format])
  if (format === 'json') {
    try {
      return parseGainOutput(JSON.parse(raw))
    } catch {
      throw new Error('Invalid JSON from mycelium gain')
    }
  }

  return { raw }
}

export async function getGainHistory(format: 'json' | 'text' = 'json') {
  const raw = await run(['gain', '--history', '--format', format])
  if (format === 'json') {
    try {
      return parseGainOutput(JSON.parse(raw))
    } catch {
      throw new Error('Invalid JSON from mycelium gain')
    }
  }

  return { raw }
}

export async function getDailyGainOutput(): Promise<GainCliOutput | null> {
  try {
    const raw = await run(['gain', '--daily', '--format', 'json'])
    return parseGainOutput(JSON.parse(raw))
  } catch {
    return null
  }
}
