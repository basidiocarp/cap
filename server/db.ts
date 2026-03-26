import type { Database as DatabaseType } from 'better-sqlite3'
import Database from 'better-sqlite3'

import { appDataPath } from './lib/platform.ts'
import { logger } from './logger.ts'

function defaultDbPath(): string {
  return appDataPath('hyphae', 'hyphae.db')
}

const DEFAULT_DB_PATH = defaultDbPath()

let db: DatabaseType | null = null
let initialized = false

export function getDb(): DatabaseType | null {
  if (initialized) return db

  initialized = true
  try {
    const dbPath = process.env.HYPHAE_DB ?? DEFAULT_DB_PATH
    logger.info({ dbPath }, 'Opening hyphae database (read-only)')
    db = new Database(dbPath, { readonly: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.warn({ error: message, path: process.env.HYPHAE_DB ?? DEFAULT_DB_PATH }, 'Hyphae database not available')
    db = null
  }

  return db
}

export function closeDb() {
  db?.close()
  db = null
  initialized = false
}
