import type { ConceptRow, MemoirRow } from '../../types.ts'
import { getDb } from '../../db.ts'
import { findMemoirByName } from './shared.ts'

export function memoirList(): MemoirRow[] {
  const db = getDb()
  if (!db) return []
  return db.prepare('SELECT * FROM memoirs ORDER BY updated_at DESC').all() as MemoirRow[]
}

export function memoirShow(
  name: string,
  options?: { limit?: number; offset?: number; q?: string }
): { memoir: MemoirRow; concepts: ConceptRow[]; limit: number; offset: number; query?: string | null; total_concepts: number } | null {
  const db = getDb()
  const memoir = findMemoirByName(name)
  if (!db || !memoir) return null

  const limit = Math.min(Math.max(Math.floor(options?.limit ?? 200), 1), 500)
  const offset = Math.max(Math.floor(options?.offset ?? 0), 0)
  const query = options?.q?.trim()

  if (query) {
    const like = `%${query.toLowerCase()}%`
    const totalConcepts = (
      db
        .prepare(
          `SELECT COUNT(*) as count
           FROM concepts
           WHERE memoir_id = ?
             AND (lower(name) LIKE ? OR lower(definition) LIKE ?)`
        )
        .get(memoir.id, like, like) as { count: number }
    ).count

    const concepts = db
      .prepare(
        `SELECT *
         FROM concepts
         WHERE memoir_id = ?
           AND (lower(name) LIKE ? OR lower(definition) LIKE ?)
         ORDER BY confidence DESC, name ASC
         LIMIT ? OFFSET ?`
      )
      .all(memoir.id, like, like, limit, offset) as ConceptRow[]

    return { concepts, limit, memoir, offset, query, total_concepts: totalConcepts }
  }

  const totalConcepts = (db.prepare('SELECT COUNT(*) as count FROM concepts WHERE memoir_id = ?').get(memoir.id) as { count: number }).count
  const concepts = db
    .prepare('SELECT * FROM concepts WHERE memoir_id = ? ORDER BY confidence DESC, name ASC LIMIT ? OFFSET ?')
    .all(memoir.id, limit, offset) as ConceptRow[]

  return { concepts, limit, memoir, offset, query: null, total_concepts: totalConcepts }
}
