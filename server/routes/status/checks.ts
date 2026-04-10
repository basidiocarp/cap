import { execFile } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { promisify } from 'node:util'

import type { LspInfo, PromiseFilled, StatusResult } from './types.ts'
import { detectAgentRuntimes } from '../../lib/agent-runtimes.ts'
import { cachedAsync } from '../../lib/cache.ts'
import { HYPHAE_BIN, MYCELIUM_BIN } from '../../lib/config.ts'
import { cursorConfigPath, findCommandPath, isCommandAvailable, isProcessRunning } from '../../lib/platform.ts'
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

function claudeAdapterStatus(
  status: ReturnType<typeof detectAgentRuntimes>,
  hooks: StatusResult['hooks']
): NonNullable<StatusResult['adapter_status']> {
  const claude = status.claude_code
  if (!claude.detected && !claude.configured) return 'none'
  if (!claude.configured) return 'partial'
  if (hooks.error_count > 0) return 'partial'
  if (hooks.lifecycle.some((hook) => !hook.installed)) return 'partial'
  return 'connected'
}

function codexAdapterStatus(status: ReturnType<typeof detectAgentRuntimes>): NonNullable<StatusResult['adapter_status']> {
  const codex = status.codex
  if (!codex.detected && !codex.configured) return 'none'
  if (codex.configured && codex.notify?.configured && codex.notify.contract_matched) return 'connected'
  return 'partial'
}

type CursorConfigRoot = { mcpServers?: Record<string, unknown> }

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasExpectedArgs(server: Record<string, unknown>, expectedArgs: string[]): boolean {
  if (!Array.isArray(server.args)) {
    return false
  }

  const args = server.args
  return expectedArgs.every((arg, index) => args[index] === arg)
}

function commandMatchesBinary(
  server: Record<string, unknown>,
  expectedBinary: string,
  resolveCommand: (command: string) => string | null
): boolean {
  if (typeof server.command !== 'string' || server.command.trim().length === 0) {
    return false
  }

  const resolved = resolveCommand(server.command.trim())
  return resolved !== null && basename(resolved) === expectedBinary
}

function isExpectedCursorServer(
  server: unknown,
  expectedBinary: string,
  expectedArgs: string[],
  resolveCommand: (command: string) => string | null
): boolean {
  if (!isObjectRecord(server)) {
    return false
  }

  return commandMatchesBinary(server, expectedBinary, resolveCommand) && hasExpectedArgs(server, expectedArgs)
}

export function cursorAdapterStatusFromConfig(
  root: CursorConfigRoot,
  resolveCommand: (command: string) => string | null = findCommandPath
): NonNullable<StatusResult['adapter_status']> {
  const servers = root.mcpServers ?? {}
  const hyphaePresent = Object.hasOwn(servers, 'hyphae')
  const rhizomePresent = Object.hasOwn(servers, 'rhizome')
  const hyphaeConfigured = isExpectedCursorServer(servers.hyphae, 'hyphae', ['serve'], resolveCommand)
  const rhizomeConfigured = isExpectedCursorServer(servers.rhizome, 'rhizome', ['serve', '--expanded'], resolveCommand)

  if (hyphaeConfigured && rhizomeConfigured) {
    return 'connected'
  }

  if (hyphaeConfigured || rhizomeConfigured || hyphaePresent || rhizomePresent) {
    return 'partial'
  }

  return 'partial'
}

function cursorAdapterStatus(): NonNullable<StatusResult['adapter_status']> {
  const configPath = cursorConfigPath()
  const detected = existsSync(dirname(configPath))

  if (!existsSync(configPath)) {
    return detected ? 'partial' : 'none'
  }

  try {
    const root = JSON.parse(readFileSync(configPath, 'utf8')) as CursorConfigRoot
    return cursorAdapterStatusFromConfig(root)
  } catch {
    return 'partial'
  }
}

function resolveHostSummary(
  status: ReturnType<typeof detectAgentRuntimes>,
  hooks: StatusResult['hooks']
): Pick<StatusResult, 'adapter_status' | 'host'> {
  const candidates: Array<{ host: NonNullable<StatusResult['host']>; status: NonNullable<StatusResult['adapter_status']> }> = [
    { host: 'claude-code', status: claudeAdapterStatus(status, hooks) },
    { host: 'codex', status: codexAdapterStatus(status) },
    { host: 'cursor', status: cursorAdapterStatus() },
  ]

  const connected = candidates.filter((candidate) => candidate.status === 'connected')
  if (connected.length === 1) {
    return { adapter_status: 'connected', host: connected[0].host }
  }
  if (connected.length > 1) {
    return { adapter_status: 'connected', host: 'unknown' }
  }

  const partial = candidates.filter((candidate) => candidate.status === 'partial')
  if (partial.length === 1) {
    return { adapter_status: 'partial', host: partial[0].host }
  }
  if (partial.length > 1) {
    return { adapter_status: 'partial', host: 'unknown' }
  }

  return { adapter_status: 'none', host: 'unknown' }
}

async function fetchStatus(): Promise<StatusResult> {
  const [myceliumResult, hyphaeResult, hooksResult] = await Promise.allSettled([checkMycelium(), checkHyphae(), loadHookHealth()])
  const agents = detectAgentRuntimes()
  const hooks =
    hooksResult.status === 'fulfilled'
      ? hooksResult.value
      : { error_count: 0, installed_hooks: [], lifecycle: buildLifecycleCoverage([]), recent_errors: [] }
  const hostSummary = resolveHostSummary(agents, hooks)

  return {
    adapter_status: hostSummary.adapter_status,
    agents,
    hooks,
    host: hostSummary.host,
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
