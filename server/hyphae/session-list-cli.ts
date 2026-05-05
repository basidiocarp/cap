import type { SessionRecord } from '../types.ts'
import { createCliRunner } from '../lib/cli.ts'
import { HYPHAE_BIN } from '../lib/config.ts'
import { callLocalService } from '../lib/local-service.ts'
import { logger } from '../logger.ts'

const runCli = createCliRunner(HYPHAE_BIN, 'hyphae')
const SESSION_LIST_SCHEMA_VERSION = '1.0'

export interface SessionCliQuery {
  project?: string
  projectRoot?: string
  scope?: string
  worktreeId?: string
}

export class HyphaeSessionListCliError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'HyphaeSessionListCliError'
  }
}

function isSessionRecord(value: unknown): value is SessionRecord {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.project === 'string' &&
    'project_root' in record &&
    (record.project_root === null || typeof record.project_root === 'string') &&
    (record.runtime_session_id === null || typeof record.runtime_session_id === 'string' || record.runtime_session_id === undefined) &&
    'worktree_id' in record &&
    (record.worktree_id === null || typeof record.worktree_id === 'string') &&
    (record.scope === null || typeof record.scope === 'string' || record.scope === undefined) &&
    (record.task === null || typeof record.task === 'string') &&
    typeof record.started_at === 'string' &&
    (record.ended_at === null || typeof record.ended_at === 'string') &&
    (record.summary === null || typeof record.summary === 'string') &&
    (record.files_modified === null || typeof record.files_modified === 'string') &&
    (record.errors === null || typeof record.errors === 'string') &&
    typeof record.status === 'string'
  )
}

function parseSessionList(stdout: string): SessionRecord[] {
  try {
    const parsed = JSON.parse(stdout) as { schema_version?: string; sessions?: unknown } | unknown
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('schema_version' in parsed) ||
      (parsed as { schema_version?: string }).schema_version !== SESSION_LIST_SCHEMA_VERSION ||
      !('sessions' in parsed)
    ) {
      throw new HyphaeSessionListCliError('Hyphae session list returned an invalid payload')
    }

    const sessions = (parsed as { sessions?: unknown }).sessions
    if (!Array.isArray(sessions) || !sessions.every(isSessionRecord)) {
      throw new HyphaeSessionListCliError('Hyphae session list returned an invalid payload')
    }

    return sessions
  } catch (err) {
    logger.debug({ err }, 'Failed to parse Hyphae session list CLI output')
    throw new HyphaeSessionListCliError('Failed to parse Hyphae session list CLI output', { cause: err })
  }
}

export async function getSessionListFromCli(options: SessionCliQuery = {}, limit = 20): Promise<SessionRecord[]> {
  try {
    const params: Record<string, unknown> = { limit }
    if (options.project) {
      params.project = options.project
    }
    if (options.projectRoot) {
      params.project_root = options.projectRoot
    }
    if (options.worktreeId) {
      params.worktree_id = options.worktreeId
    }
    if (options.scope) {
      params.scope = options.scope
    }
    const raw = await callLocalService('hyphae', 'cap_session_list', params)
    if (raw) {
      const parsed = JSON.parse(raw) as { schema_version?: string; sessions?: unknown } | unknown
      if (
        parsed &&
        typeof parsed === 'object' &&
        'schema_version' in parsed &&
        (parsed as { schema_version?: string }).schema_version === SESSION_LIST_SCHEMA_VERSION &&
        'sessions' in parsed
      ) {
        const sessions = (parsed as { sessions?: unknown }).sessions
        if (Array.isArray(sessions) && sessions.every(isSessionRecord)) {
          return sessions
        }
      }
    }
  } catch (err) {
    logger.debug({ err }, 'hyphae socket unavailable for getSessionListFromCli, falling back to CLI')
  }
  const args = ['session', 'list']
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
    return parseSessionList(stdout)
  } catch (err) {
    logger.debug({ err }, 'Failed to load Hyphae session list from CLI')
    throw new HyphaeSessionListCliError('Failed to load Hyphae session list from CLI', { cause: err })
  }
}
