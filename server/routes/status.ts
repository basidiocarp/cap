import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Hono } from 'hono'

import { getDb } from '../db.ts'
import { logger } from '../logger.ts'
import { rhizome } from '../rhizome.ts'

const exec = promisify(execFile)

const HYPHAE_BIN = process.env.HYPHAE_BIN ?? 'hyphae'
const MYCELIUM_BIN = process.env.MYCELIUM_BIN ?? 'mycelium'

const CACHE_TTL = 30_000

interface StatusResult {
  hyphae: { available: boolean; memories: number; memoirs: number; version: string | null }
  mycelium: { available: boolean; version: string | null }
  rhizome: { available: boolean; backend: 'tree-sitter' | 'lsp' | null; languages: string[] }
}

let cache: { data: StatusResult; timestamp: number } | null = null

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
      const memRow = db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number }
      memories = memRow.count
      const memoirRow = db.prepare('SELECT COUNT(*) as count FROM memoirs').get() as { count: number }
      memoirs = memoirRow.count
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
  const available = rhizome.isAvailable()
  return {
    available,
    backend: available ? 'tree-sitter' : null,
    languages: available ? ['rust', 'typescript', 'javascript', 'python', 'go', 'java', 'c', 'cpp', 'ruby'] : [],
  }
}

const app = new Hono()

app.get('/', async (c) => {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return c.json(cache.data)
  }

  const [myceliumResult, hyphaeResult] = await Promise.allSettled([checkMycelium(), checkHyphae()])

  const data: StatusResult = {
    hyphae: hyphaeResult.status === 'fulfilled' ? hyphaeResult.value : { available: false, memoirs: 0, memories: 0, version: null },
    mycelium: myceliumResult.status === 'fulfilled' ? myceliumResult.value : { available: false, version: null },
    rhizome: checkRhizome(),
  }

  cache = { data, timestamp: Date.now() }
  return c.json(data)
})

export default app
