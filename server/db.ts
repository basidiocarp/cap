import type { Database as DatabaseType } from 'better-sqlite3'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'

import { logger } from './logger.ts'

function defaultDbPath(): string {
  const home = homedir()
  if (platform() === 'darwin') {
    return join(home, 'Library', 'Application Support', 'hyphae', 'hyphae.db')
  }
  // Linux/other: XDG data dir
  return join(process.env.XDG_DATA_HOME ?? join(home, '.local', 'share'), 'hyphae', 'hyphae.db')
}

const DEFAULT_DB_PATH = defaultDbPath()

let db: DatabaseType | null = null
let dbError: string | null = null

export function getDb(): DatabaseType | null {
  if (db !== undefined) return db

  try {
    const dbPath = process.env.HYPHAE_DB ?? DEFAULT_DB_PATH
    logger.info({ dbPath }, 'Opening hyphae database (read-only)')
    db = new Database(dbPath, { readonly: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    dbError = message
    logger.warn({ error: message, path: process.env.HYPHAE_DB ?? DEFAULT_DB_PATH }, 'Hyphae database not available')
    db = null
  }

  return db
}

export function closeDb() {
  db?.close()
  db = null
}
