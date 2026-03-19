import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Hono } from 'hono'

import { getDb } from '../db.ts'
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

type PromiseFilled<T> = { status: 'fulfilled'; value: T }

interface StatusResult {
  hyphae: { available: boolean; memories: number; memoirs: number; version: string | null }
  lsps: LspInfo[]
  mycelium: { available: boolean; version: string | null }
  rhizome: { available: boolean; backend: 'tree-sitter' | 'lsp' | null; languages: string[] }
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
    languages: available ? ['rust', 'typescript', 'javascript', 'python', 'go', 'java', 'c', 'cpp', 'ruby'] : [],
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

async function fetchStatus(): Promise<StatusResult> {
  const [myceliumResult, hyphaeResult] = await Promise.allSettled([checkMycelium(), checkHyphae()])
  return {
    hyphae: hyphaeResult.status === 'fulfilled' ? hyphaeResult.value : { available: false, memoirs: 0, memories: 0, version: null },
    lsps: await checkLsps(),
    mycelium: myceliumResult.status === 'fulfilled' ? myceliumResult.value : { available: false, version: null },
    rhizome: checkRhizome(),
  }
}

const getStatus = cachedAsync(fetchStatus, 30_000)

const app = new Hono()

app.get('/', async (c) => {
  return c.json(await getStatus())
})

export default app
