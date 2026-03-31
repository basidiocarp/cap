import type { HyphaeMemoryActivity } from './types.ts'
import { createCliRunner } from '../../lib/cli.ts'
import { HYPHAE_BIN } from '../../lib/config.ts'
import { logger } from '../../logger.ts'

const runCli = createCliRunner(HYPHAE_BIN, 'hyphae')
const ACTIVITY_SCHEMA_VERSION = '1.0'

export interface HyphaeStatusSnapshot {
  activity: HyphaeMemoryActivity
  memories: number
  memoirs: number
}

export class HyphaeStatusCliError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'HyphaeStatusCliError'
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function isActivity(value: unknown): value is HyphaeMemoryActivity {
  const record = asRecord(value)
  return (
    !!record &&
    typeof record.codex_memory_count === 'number' &&
    (record.last_codex_memory_at === null || typeof record.last_codex_memory_at === 'string') &&
    (record.last_session_memory_at === null || typeof record.last_session_memory_at === 'string') &&
    (record.last_session_topic === null || typeof record.last_session_topic === 'string') &&
    typeof record.recent_session_memory_count === 'number'
  )
}

function isSnapshot(value: unknown): value is HyphaeStatusSnapshot {
  const record = asRecord(value)
  return !!record && typeof record.memories === 'number' && typeof record.memoirs === 'number' && isActivity(record.activity)
}

function parseSnapshot(stdout: string): HyphaeStatusSnapshot {
  try {
    const parsed = JSON.parse(stdout) as unknown
    const record = asRecord(parsed)
    if (!record || record.schema_version !== ACTIVITY_SCHEMA_VERSION || !isSnapshot(record.snapshot)) {
      throw new HyphaeStatusCliError('Hyphae activity returned an invalid payload')
    }
    return record.snapshot
  } catch (err) {
    logger.debug({ err }, 'Failed to parse Hyphae activity CLI output')
    if (err instanceof HyphaeStatusCliError) throw err
    throw new HyphaeStatusCliError('Failed to parse Hyphae activity CLI output', { cause: err })
  }
}

export async function getHyphaeStatusSnapshot(): Promise<HyphaeStatusSnapshot> {
  try {
    const stdout = await runCli(['activity'])
    return parseSnapshot(stdout)
  } catch (err) {
    if (err instanceof HyphaeStatusCliError) throw err
    logger.debug({ err }, 'Failed to load Hyphae activity from CLI')
    throw new HyphaeStatusCliError('Failed to load Hyphae activity from CLI', { cause: err })
  }
}
