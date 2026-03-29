import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { HookError, HookHealthResult, HookInfo, HookLifecycleStatus, HyphaeMemoryActivity } from './types.ts'
import { claudeSettingsPath } from '../../lib/platform.ts'
import { logger } from '../../logger.ts'
import { RECOMMENDED_HOOK_EVENTS } from './constants.ts'

const DEFAULT_HOOK_ERROR_LOG = join(tmpdir(), 'hyphae-hook-errors.log')

export function emptyHyphaeActivity(): HyphaeMemoryActivity {
  return {
    codex_memory_count: 0,
    last_codex_memory_at: null,
    last_session_memory_at: null,
    last_session_topic: null,
    recent_session_memory_count: 0,
  }
}

export function buildLifecycleCoverage(installedHooks: HookInfo[]): HookLifecycleStatus[] {
  return RECOMMENDED_HOOK_EVENTS.map((event) => ({
    event,
    installed: installedHooks.some((hook) => hook.event.toLowerCase() === event.toLowerCase()),
    matching_hooks: installedHooks.filter((hook) => hook.event.toLowerCase() === event.toLowerCase()).length,
  }))
}

function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === 'object' && err !== null && 'code' in err
}

export async function loadHookHealth(): Promise<HookHealthResult> {
  try {
    const settingsPath = claudeSettingsPath()
    const errorLogPath = process.env.HYPHAE_HOOK_ERROR_LOG ?? DEFAULT_HOOK_ERROR_LOG

    let installedHooks: HookInfo[] = []
    try {
      const settingsContent = await readFile(settingsPath, 'utf-8')
      const settings = JSON.parse(settingsContent) as { hooks?: Record<string, unknown>[] }
      if (Array.isArray(settings.hooks)) {
        installedHooks = settings.hooks
          .filter((h): h is Record<string, unknown> => typeof h === 'object')
          .map((h) => ({
            command: String(h.command ?? ''),
            event: String(h.event ?? ''),
            matcher: String(h.matcher ?? ''),
          }))
      }
    } catch (err) {
      if (!isErrnoException(err) || err.code !== 'ENOENT') {
        logger.debug({ err, settingsPath }, 'Failed to read hook settings')
      }
    }

    let recentErrors: HookError[] = []
    try {
      const logContent = await readFile(errorLogPath, 'utf-8')
      const lines = logContent.split('\n').filter((l) => l.trim())
      recentErrors = lines.slice(-20).map((line) => {
        try {
          const parsed = JSON.parse(line) as { hook?: string; message?: string; timestamp?: string }
          return {
            hook: String(parsed.hook ?? 'unknown'),
            message: String(parsed.message ?? ''),
            timestamp: String(parsed.timestamp ?? new Date().toISOString()),
          }
        } catch {
          return {
            hook: 'unknown',
            message: line.substring(0, 100),
            timestamp: new Date().toISOString(),
          }
        }
      })
    } catch (err) {
      if (!isErrnoException(err) || err.code !== 'ENOENT') {
        logger.debug({ err, errorLogPath }, 'Failed to read hook error log')
      }
    }

    return {
      error_count: recentErrors.length,
      installed_hooks: installedHooks,
      lifecycle: buildLifecycleCoverage(installedHooks),
      recent_errors: recentErrors,
    }
  } catch (err) {
    logger.debug({ err }, 'Hook health check failed')
    return {
      error_count: 0,
      installed_hooks: [],
      lifecycle: buildLifecycleCoverage([]),
      recent_errors: [],
    }
  }
}
