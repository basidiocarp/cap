import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { LspInfo, PromiseFilled, StatusResult } from './types.ts'
import { getDb } from '../../db.ts'
import { detectAgentRuntimes } from '../../lib/agent-runtimes.ts'
import { cachedAsync } from '../../lib/cache.ts'
import { HYPHAE_BIN, MYCELIUM_BIN } from '../../lib/config.ts'
import { isCommandAvailable, isProcessRunning } from '../../lib/platform.ts'
import { registry } from '../../lib/rhizome-registry.ts'
import { logger } from '../../logger.ts'
import { LSP_SERVERS } from './constants.ts'
import { buildLifecycleCoverage, emptyHyphaeActivity, loadHookHealth } from './hooks.ts'

const exec = promisify(execFile)

async function checkMycelium(): Promise<StatusResult['mycelium']> {
  try {
    const { stdout } = await exec(MYCELIUM_BIN, ['--version'], { timeout: 2000 })
    return { available: true, version: stdout.trim() || null }
  } catch (err) {
    logger.debug({ err }, 'Mycelium not available')
    return { available: false, version: null }
  }
}

async function checkHyphae(): Promise<StatusResult['hyphae']> {
  try {
    const { stdout } = await exec(HYPHAE_BIN, ['--version'], { timeout: 2000 })
    const version = stdout.trim() || null

    let memories = 0
    let memoirs = 0
    let activity = emptyHyphaeActivity()
    try {
      const db = getDb()
      if (db) {
        const memRow = db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number }
        memories = memRow.count
        const memoirRow = db.prepare('SELECT COUNT(*) as count FROM memoirs').get() as { count: number }
        memoirs = memoirRow.count
        const codexCountRow = db.prepare("SELECT COUNT(*) as count FROM memories WHERE keywords LIKE '%host:codex%'").get() as {
          count: number
        }
        const lastCodexRow = db
          .prepare("SELECT created_at FROM memories WHERE keywords LIKE '%host:codex%' ORDER BY created_at DESC LIMIT 1")
          .get() as { created_at: string } | undefined
        const lastSessionRow = db
          .prepare("SELECT topic, created_at FROM memories WHERE topic LIKE 'session/%' ORDER BY created_at DESC LIMIT 1")
          .get() as { created_at: string; topic: string } | undefined
        const recentSessionRow = db
          .prepare("SELECT COUNT(*) as count FROM memories WHERE topic LIKE 'session/%' AND created_at >= datetime('now', '-1 day')")
          .get() as { count: number }

        activity = {
          codex_memory_count: codexCountRow.count,
          last_codex_memory_at: lastCodexRow?.created_at ?? null,
          last_session_memory_at: lastSessionRow?.created_at ?? null,
          last_session_topic: lastSessionRow?.topic ?? null,
          recent_session_memory_count: recentSessionRow.count,
        }
      }
    } catch (dbErr) {
      logger.debug({ err: dbErr }, 'Hyphae DB query failed')
    }

    return { activity, available: true, memoirs, memories, version }
  } catch (err) {
    logger.debug({ err }, 'Hyphae not available')
    return { activity: emptyHyphaeActivity(), available: false, memoirs: 0, memories: 0, version: null }
  }
}

function checkRhizome(): StatusResult['rhizome'] {
  const available = registry.getActive().isAvailable()
  return {
    available,
    backend: available ? 'tree-sitter' : null,
    languages: available
      ? [
          'bash',
          'c',
          'cpp',
          'csharp',
          'dart',
          'elixir',
          'go',
          'haskell',
          'java',
          'javascript',
          'julia',
          'kotlin',
          'lua',
          'ocaml',
          'php',
          'python',
          'ruby',
          'rust',
          'scala',
          'swift',
          'terraform',
          'typescript',
          'yaml',
          'zig',
        ]
      : [],
  }
}

async function checkLsps(): Promise<LspInfo[]> {
  const results = await Promise.allSettled(
    LSP_SERVERS.map(async (server) => {
      const available = isCommandAvailable(server.bin)
      let running = false
      if (available) {
        running = await isProcessRunning(server.bin)
      }
      return { available, bin: server.bin, language: server.language, name: server.name, running }
    })
  )
  return results.filter((r): r is PromiseFilled<LspInfo> => r.status === 'fulfilled').map((r) => r.value)
}

async function fetchStatus(): Promise<StatusResult> {
  const [myceliumResult, hyphaeResult, hooksResult] = await Promise.allSettled([checkMycelium(), checkHyphae(), loadHookHealth()])
  return {
    agents: detectAgentRuntimes(),
    hooks:
      hooksResult.status === 'fulfilled'
        ? hooksResult.value
        : { error_count: 0, installed_hooks: [], lifecycle: buildLifecycleCoverage([]), recent_errors: [] },
    hyphae:
      hyphaeResult.status === 'fulfilled'
        ? hyphaeResult.value
        : { activity: emptyHyphaeActivity(), available: false, memoirs: 0, memories: 0, version: null },
    lsps: await checkLsps(),
    mycelium: myceliumResult.status === 'fulfilled' ? myceliumResult.value : { available: false, version: null },
    project: {
      active: registry.getActiveProject(),
      recent: registry.getRecentProjects(),
    },
    rhizome: checkRhizome(),
  }
}

export const getStatus = cachedAsync(fetchStatus, 30_000)
