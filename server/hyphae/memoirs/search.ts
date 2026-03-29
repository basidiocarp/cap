import type { ConceptRow } from '../../types.ts'
import { getDb } from '../../db.ts'
import { findMemoirByName } from './shared.ts'

export function memoirSearch(memoirName: string, query: string): ConceptRow[] {
  const db = getDb()
  const memoir = findMemoirByName(memoirName)
  if (!db || !memoir) return []

  return db
    .prepare(
      `SELECT c.*
       FROM concepts c
       JOIN concepts_fts fts ON c.rowid = fts.rowid
       WHERE concepts_fts MATCH ? AND c.memoir_id = ?
       ORDER BY rank`
    )
    .all(query, memoir.id) as ConceptRow[]
}

export function memoirSearchAll(query: string): ConceptRow[] {
  const db = getDb()
  if (!db) return []
  return db
    .prepare(
      `SELECT c.*
       FROM concepts c
       JOIN concepts_fts fts ON c.rowid = fts.rowid
       WHERE concepts_fts MATCH ?
       ORDER BY rank`
    )
    .all(query) as ConceptRow[]
}
