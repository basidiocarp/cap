import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import type { LspInfo, PromiseFilled, StatusResult } from './types.ts'
import { detectAgentRuntimes } from '../../lib/agent-runtimes.ts'
import { cachedAsync } from '../../lib/cache.ts'
import { HYPHAE_BIN, MYCELIUM_BIN } from '../../lib/config.ts'
import { isCommandAvailable, isProcessRunning } from '../../lib/platform.ts'
import { registry } from '../../lib/rhizome-registry.ts'
import { logger } from '../../logger.ts'
import { LSP_SERVERS } from './constants.ts'
import { buildLifecycleCoverage, emptyHyphaeActivity, loadHookHealth } from './hooks.ts'
import { getHyphaeStatusSnapshot } from './hyphae-cli.ts'

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

    try {
      const snapshot = await getHyphaeStatusSnapshot()
      return {
        activity: snapshot.activity,
        available: true,
        memoirs: snapshot.memoirs,
        memories: snapshot.memories,
        version,
      }
    } catch (activityErr) {
      logger.debug({ err: activityErr }, 'Hyphae activity CLI failed')
      return { activity: emptyHyphaeActivity(), available: true, memoirs: 0, memories: 0, version }
    }
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
