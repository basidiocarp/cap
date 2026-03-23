import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { Hono } from 'hono'

import { getDb } from '../db.ts'
import { detectAgentRuntimes } from '../lib/agent-runtimes.ts'
import { cachedAsync } from '../lib/cache.ts'
import { HYPHAE_BIN, MYCELIUM_BIN } from '../lib/config.ts'
import { registry } from '../lib/rhizome-registry.ts'
import { logger } from '../logger.ts'

const exec = promisify(execFile)

// Common language servers and their binary names
const LSP_SERVERS: { bin: string; language: string; name: string }[] = [
  { bin: 'typescript-language-server', language: 'TypeScript/JavaScript', name: 'typescript-language-server' },
  { bin: 'rust-analyzer', language: 'Rust', name: 'rust-analyzer' },
  { bin: 'pyright-langserver', language: 'Python', name: 'Pyright' },
  { bin: 'pylsp', language: 'Python', name: 'python-lsp-server' },
  { bin: 'gopls', language: 'Go', name: 'gopls' },
  { bin: 'clangd', language: 'C/C++', name: 'clangd' },
  { bin: 'lua-language-server', language: 'Lua', name: 'lua-language-server' },
  { bin: 'ruby-lsp', language: 'Ruby', name: 'ruby-lsp' },
  { bin: 'solargraph', language: 'Ruby', name: 'Solargraph' },
  { bin: 'zls', language: 'Zig', name: 'zls' },
  { bin: 'jdtls', language: 'Java', name: 'jdtls' },
  { bin: 'kotlin-language-server', language: 'Kotlin', name: 'kotlin-language-server' },
  { bin: 'elixir-ls', language: 'Elixir', name: 'elixir-ls' },
  { bin: 'sourcekit-lsp', language: 'Swift', name: 'sourcekit-lsp' },
]

interface LspInfo {
  available: boolean
  bin: string
  language: string
  name: string
  running: boolean
}

interface HookInfo {
  command: string
  event: string
  matcher: string
}

interface HookError {
  hook: string
  message: string
  timestamp: string
}

interface HookHealthResult {
  error_count: number
  installed_hooks: HookInfo[]
  lifecycle: HookLifecycleStatus[]
  recent_errors: HookError[]
}

interface HookLifecycleStatus {
  event: string
  installed: boolean
  matching_hooks: number
}

interface CodexNotifyStatus {
  command: string | null
  config_path: string | null
  configured: boolean
  contract_matched: boolean
}

interface AgentRuntimeStatus {
  config_path: string | null
  configured: boolean
  detected: boolean
  integration: 'hooks' | 'mcp'
  notify?: CodexNotifyStatus
}

type PromiseFilled<T> = { status: 'fulfilled'; value: T }

interface StatusResult {
  agents: {
    claude_code: AgentRuntimeStatus
    codex: AgentRuntimeStatus
  }
  hyphae: { available: boolean; memories: number; memoirs: number; version: string | null }
  hooks: HookHealthResult
  lsps: LspInfo[]
  mycelium: { available: boolean; version: string | null }
  project: { active: string; recent: string[] }
  rhizome: { available: boolean; backend: 'tree-sitter' | 'lsp' | null; languages: string[] }
}

const RECOMMENDED_HOOK_EVENTS = ['SessionStart', 'PostToolUse', 'PreCompact', 'SessionEnd'] as const
const DEFAULT_HOOK_ERROR_LOG = join(tmpdir(), 'hyphae-hook-errors.log')

function buildLifecycleCoverage(installedHooks: HookInfo[]): HookLifecycleStatus[] {
  return RECOMMENDED_HOOK_EVENTS.map((event) => ({
    event,
    installed: installedHooks.some((hook) => hook.event.toLowerCase() === event.toLowerCase()),
    matching_hooks: installedHooks.filter((hook) => hook.event.toLowerCase() === event.toLowerCase()).length,
  }))
}

function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === 'object' && err !== null && 'code' in err
}

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
    try {
      const db = getDb()
      if (db) {
        const memRow = db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number }
        memories = memRow.count
        const memoirRow = db.prepare('SELECT COUNT(*) as count FROM memoirs').get() as { count: number }
        memoirs = memoirRow.count
      }
    } catch (dbErr) {
      logger.debug({ err: dbErr }, 'Hyphae DB query failed')
    }

    return { available: true, memoirs, memories, version }
  } catch (err) {
    logger.debug({ err }, 'Hyphae not available')
    return { available: false, memoirs: 0, memories: 0, version: null }
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
      let available = false
      let running = false
      try {
        await exec('which', [server.bin], { timeout: 1000 })
        available = true
      } catch {
        // not installed
      }
      if (available) {
        try {
          await exec('pgrep', ['-x', server.bin], { timeout: 1000 })
          running = true
        } catch {
          // installed but no active process
        }
      }
      return { available, bin: server.bin, language: server.language, name: server.name, running }
    })
  )
  return results.filter((r): r is PromiseFilled<LspInfo> => r.status === 'fulfilled').map((r) => r.value)
}

async function loadHookHealth(): Promise<HookHealthResult> {
  try {
    const settingsPath = join(homedir(), '.claude', 'settings.json')
    const errorLogPath = process.env.HYPHAE_HOOK_ERROR_LOG ?? DEFAULT_HOOK_ERROR_LOG

    // ─────────────────────────────────────────────────────────────────────────────
    // Read installed hooks from settings
    // ─────────────────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────────────────
    // Read recent errors from log file
    // ─────────────────────────────────────────────────────────────────────────────

    let recentErrors: HookError[] = []
    try {
      const logContent = await readFile(errorLogPath, 'utf-8')
      const lines = logContent.split('\n').filter((l) => l.trim())
      recentErrors = lines
        .slice(-20) // Last 20 errors
        .map((line) => {
          try {
            const parsed = JSON.parse(line) as { hook?: string; message?: string; timestamp?: string }
            return {
              hook: String(parsed.hook ?? 'unknown'),
              message: String(parsed.message ?? ''),
              timestamp: String(parsed.timestamp ?? new Date().toISOString()),
            }
          } catch {
            // Fallback for non-JSON lines
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

async function fetchStatus(): Promise<StatusResult> {
  const [myceliumResult, hyphaeResult, hooksResult] = await Promise.allSettled([checkMycelium(), checkHyphae(), loadHookHealth()])
  return {
    agents: detectAgentRuntimes(),
    hooks:
      hooksResult.status === 'fulfilled'
        ? hooksResult.value
        : { error_count: 0, installed_hooks: [], lifecycle: buildLifecycleCoverage([]), recent_errors: [] },
    hyphae: hyphaeResult.status === 'fulfilled' ? hyphaeResult.value : { available: false, memoirs: 0, memories: 0, version: null },
    lsps: await checkLsps(),
    mycelium: myceliumResult.status === 'fulfilled' ? myceliumResult.value : { available: false, version: null },
    project: {
      active: registry.getActiveProject(),
      recent: registry.getRecentProjects(),
    },
    rhizome: checkRhizome(),
  }
}

const getStatus = cachedAsync(fetchStatus, 30_000)

const app = new Hono()

app.get('/', async (c) => {
  return c.json(await getStatus())
})

export default app
