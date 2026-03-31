import type { SessionTimelineRecord } from '../types.ts'
import type { SessionCliQuery } from './session-list-cli.ts'
import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { logger } from '../logger.ts'

const runCli = createCliRunner(HYPHAE_BIN, 'hyphae')
const SESSION_TIMELINE_SCHEMA_VERSION = '1.0'

export class HyphaeSessionTimelineCliError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'HyphaeSessionTimelineCliError'
  }
}

function isTimelineEvent(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const event = value as Record<string, unknown>
  const kind = event.kind
  return (
    typeof event.id === 'string' &&
    (kind === 'outcome' || kind === 'recall') &&
    typeof event.title === 'string' &&
    (event.detail === null || typeof event.detail === 'string') &&
    typeof event.occurred_at === 'string' &&
    (event.recall_event_id === null || typeof event.recall_event_id === 'string') &&
    (event.memory_count === null || typeof event.memory_count === 'number') &&
    (event.signal_type === null || typeof event.signal_type === 'string') &&
    (event.signal_value === null || typeof event.signal_value === 'number') &&
    (event.source === null || typeof event.source === 'string')
  )
}

function isSessionTimelineRecord(value: unknown): value is SessionTimelineRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.project === 'string' &&
    'project_root' in record &&
    (record.project_root === null || typeof record.project_root === 'string') &&
    (record.runtime_session_id === null ||
      typeof record.runtime_session_id === 'string' ||
      record.runtime_session_id === undefined) &&
    'worktree_id' in record &&
    (record.worktree_id === null || typeof record.worktree_id === 'string') &&
    (record.scope === null || typeof record.scope === 'string' || record.scope === undefined) &&
    (record.task === null || typeof record.task === 'string') &&
    typeof record.started_at === 'string' &&
    (record.ended_at === null || typeof record.ended_at === 'string') &&
    (record.summary === null || typeof record.summary === 'string') &&
    (record.files_modified === null || typeof record.files_modified === 'string') &&
    (record.errors === null || typeof record.errors === 'string') &&
    typeof record.status === 'string' &&
    typeof record.last_activity_at === 'string' &&
    typeof record.recall_count === 'number' &&
    typeof record.outcome_count === 'number' &&
    Array.isArray(record.events) &&
    record.events.every(isTimelineEvent)
  )
}

function parseSessionTimeline(stdout: string): SessionTimelineRecord[] {
  try {
    const parsed = JSON.parse(stdout) as { schema_version?: string; timeline?: unknown } | unknown
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('schema_version' in parsed) ||
      (parsed as { schema_version?: string }).schema_version !== SESSION_TIMELINE_SCHEMA_VERSION ||
      !('timeline' in parsed)
    ) {
      throw new HyphaeSessionTimelineCliError('Hyphae session timeline returned an invalid payload')
    }

    const timeline = (parsed as { timeline?: unknown }).timeline
    if (!Array.isArray(timeline) || !timeline.every(isSessionTimelineRecord)) {
      throw new HyphaeSessionTimelineCliError('Hyphae session timeline returned an invalid payload')
    }
    return timeline
  } catch (err) {
    logger.debug({ err }, 'Failed to parse Hyphae session timeline CLI output')
    throw new HyphaeSessionTimelineCliError('Failed to parse Hyphae session timeline CLI output', { cause: err })
  }
}

export async function getSessionTimelineFromCli(options: SessionCliQuery = {}, limit = 20): Promise<SessionTimelineRecord[]> {
  const args = ['session', 'timeline']
  if (options.project) {
    args.push('--project', options.project)
  } else {
    args.push('--all-projects')
  }
  if (options.projectRoot) {
    args.push('--project-root', options.projectRoot)
  }
  if (options.worktreeId) {
    args.push('--worktree-id', options.worktreeId)
  }
  if (options.scope) {
    args.push('--scope', options.scope)
  }
  args.push('--limit', String(limit))

  try {
    const stdout = await runCli(args)
    return parseSessionTimeline(stdout)
  } catch (err) {
    logger.debug({ err }, 'Failed to load Hyphae session timeline from CLI')
    throw new HyphaeSessionTimelineCliError('Failed to load Hyphae session timeline from CLI', { cause: err })
  }
}
