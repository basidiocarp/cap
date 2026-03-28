import type { ConceptLinkRow, ConceptRow, MemoirRow } from '../types.ts'
import { getDb } from '../db.ts'

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
  if (!db) return null
  const memoir = db.prepare('SELECT * FROM memoirs WHERE name = ?').get(name) as MemoirRow | undefined
  if (!memoir) return null

  const limit = Math.min(Math.max(Math.floor(options?.limit ?? 200), 1), 500)
  const offset = Math.max(Math.floor(options?.offset ?? 0), 0)
  const query = options?.q?.trim()

  if (query) {
    const like = `%${query.toLowerCase()}%`
    const total_concepts = (
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

    return { concepts, limit, memoir, offset, query, total_concepts }
  }

  const total_concepts = (db.prepare('SELECT COUNT(*) as count FROM concepts WHERE memoir_id = ?').get(memoir.id) as { count: number })
    .count
  const concepts = db
    .prepare('SELECT * FROM concepts WHERE memoir_id = ? ORDER BY confidence DESC, name ASC LIMIT ? OFFSET ?')
    .all(memoir.id, limit, offset) as ConceptRow[]
  return { concepts, limit, memoir, offset, query: null, total_concepts }
}

export function memoirInspect(
  memoirName: string,
  conceptName: string,
  depth = 2
): { concept: ConceptRow; neighbors: Array<{ concept: ConceptRow; link: ConceptLinkRow; direction: 'outgoing' | 'incoming' }> } | null {
  const db = getDb()
  if (!db) return null
  const memoir = db.prepare('SELECT * FROM memoirs WHERE name = ?').get(memoirName) as MemoirRow | undefined
  if (!memoir) return null

  const concept = db.prepare('SELECT * FROM concepts WHERE memoir_id = ? AND name = ?').get(memoir.id, conceptName) as
    | ConceptRow
    | undefined
  if (!concept) return null

  const neighbors: Array<{ concept: ConceptRow; link: ConceptLinkRow; direction: 'outgoing' | 'incoming' }> = []
  const visited = new Set<string>([concept.id])
  let frontier = [concept.id]
  const neighborLinks: Array<{ target_id: string; source_id: string; link: ConceptLinkRow; direction: 'outgoing' | 'incoming' }> = []
  const conceptIdsToFetch = new Set<string>()

  for (let depthIndex = 0; depthIndex < depth && frontier.length > 0; depthIndex++) {
    const nextFrontier: string[] = []
    for (const nodeId of frontier) {
      const outgoing = db
        .prepare(
          `SELECT cl.*, c.* FROM concept_links cl
           JOIN concepts c ON c.id = cl.target_id
           WHERE cl.source_id = ?`
        )
        .all(nodeId) as Array<ConceptLinkRow & ConceptRow>

      const incoming = db
        .prepare(
          `SELECT cl.*, c.* FROM concept_links cl
           JOIN concepts c ON c.id = cl.source_id
           WHERE cl.target_id = ?`
        )
        .all(nodeId) as Array<ConceptLinkRow & ConceptRow>

      for (const row of outgoing) {
        if (!visited.has(row.target_id)) {
          visited.add(row.target_id)
          nextFrontier.push(row.target_id)
          conceptIdsToFetch.add(row.target_id)
          neighborLinks.push({
            direction: 'outgoing',
            link: {
              created_at: row.created_at,
              id: row.id,
              relation: row.relation,
              source_id: row.source_id,
              target_id: row.target_id,
              weight: row.weight,
            },
            source_id: row.target_id,
            target_id: row.target_id,
          })
        }
      }

      for (const row of incoming) {
        if (!visited.has(row.source_id)) {
          visited.add(row.source_id)
          nextFrontier.push(row.source_id)
          conceptIdsToFetch.add(row.source_id)
          neighborLinks.push({
            direction: 'incoming',
            link: {
              created_at: row.created_at,
              id: row.id,
              relation: row.relation,
              source_id: row.source_id,
              target_id: row.target_id,
              weight: row.weight,
            },
            source_id: row.source_id,
            target_id: row.source_id,
          })
        }
      }
    }
    frontier = nextFrontier
  }

  if (conceptIdsToFetch.size > 0) {
    const conceptIds = Array.from(conceptIdsToFetch)
    const placeholders = conceptIds.map(() => '?').join(',')
    const allConcepts = db.prepare(`SELECT * FROM concepts WHERE id IN (${placeholders})`).all(...conceptIds) as ConceptRow[]
    const conceptMap = new Map(allConcepts.map((conceptRow) => [conceptRow.id, conceptRow]))

    for (const neighborLink of neighborLinks) {
      const linkedConcept = conceptMap.get(neighborLink.source_id)
      if (linkedConcept) {
        neighbors.push({
          concept: linkedConcept,
          direction: neighborLink.direction,
          link: neighborLink.link,
        })
      }
    }
  }

  return { concept, neighbors }
}

export function memoirSearch(memoirName: string, query: string): ConceptRow[] {
  const db = getDb()
  if (!db) return []
  const memoir = db.prepare('SELECT * FROM memoirs WHERE name = ?').get(memoirName) as MemoirRow | undefined
  if (!memoir) return []

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
