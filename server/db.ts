import { homedir } from 'node:os'
import { join } from 'node:path'

import Database from 'better-sqlite3'

import { logger } from './logger.ts'

import type { Database as DatabaseType } from 'better-sqlite3'

const DEFAULT_DB_PATH = join(homedir(), '.local', 'share', 'hyphae', 'hyphae.db')

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
