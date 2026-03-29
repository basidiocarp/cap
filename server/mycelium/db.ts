import { existsSync } from 'node:fs'
import Database from 'better-sqlite3'

import { logger } from '../logger.ts'
import { resolveMyceliumDbPath } from './config.ts'

export function getMyceliumDb(): Database.Database | null {
  const dbPath = resolveMyceliumDbPath()
  if (!existsSync(dbPath)) {
    return null
  }

  try {
    return new Database(dbPath, { fileMustExist: true, readonly: true })
  } catch (err) {
    logger.debug({ dbPath, err }, 'Failed to open mycelium history database')
    return null
  }
}
