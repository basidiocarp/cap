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

export function getDb(): DatabaseType {
  if (!db) {
    const dbPath = process.env.HYPHAE_DB ?? DEFAULT_DB_PATH
    logger.info({ dbPath }, 'Opening hyphae database (read-only)')
    db = new Database(dbPath, { readonly: true })
    db.pragma('journal_mode = WAL')
  }
  return db
}

export function closeDb() {
  db?.close()
  db = null
}
