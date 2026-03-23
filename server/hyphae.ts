import type {
  ConceptLinkRow,
  ConceptRow,
  HealthResult,
  Lesson,
  MemoirRow,
  MemoryRow,
  SessionRecord,
  StatsResult,
  TopicSummary,
} from './types.ts'
import { getDb } from './db.ts'
import { createCliRunner } from './lib/cli.ts'
import { logger } from './logger.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports from extracted modules
// ─────────────────────────────────────────────────────────────────────────────

export { getAnalytics } from './lib/analytics.ts'
export { gatherContext } from './lib/context-gatherer.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Reads: direct SQLite
// ─────────────────────────────────────────────────────────────────────────────

export function getStats(): StatsResult {
  const db = getDb()
  if (!db) {
    return {
      avg_weight: 0,
      newest: null,
      oldest: null,
      total_memories: 0,
      total_topics: 0,
    }
  }
  const row = db
    .prepare(
      `SELECT
        COUNT(*) as total_memories,
        COUNT(DISTINCT topic) as total_topics,
        AVG(weight) as avg_weight,
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM memories`
    )
    .get() as StatsResult
  return row
}

export function getTopics(): TopicSummary[] {
  const db = getDb()
  if (!db) return []
  return db
    .prepare(
      `SELECT
        topic,
        COUNT(*) as count,
        AVG(weight) as avg_weight,
        MAX(created_at) as newest,
        MIN(created_at) as oldest
      FROM memories
      GROUP BY topic
      ORDER BY count DESC`
    )
    .all() as TopicSummary[]
}

export function recall(query: string, topic?: string, limit = 20): MemoryRow[] {
  const db = getDb()
  if (!db) return []
  let sql = `
    SELECT m.*
    FROM memories m
    JOIN memories_fts fts ON m.rowid = fts.rowid
    WHERE memories_fts MATCH ?
  `
  const params: (string | number)[] = [query]

  if (topic) {
    sql += ' AND m.topic = ?'
    params.push(topic)
  }

  sql += ' ORDER BY rank LIMIT ?'
  params.push(limit)

  return db.prepare(sql).all(...params) as MemoryRow[]
}

export function searchGlobal(query: string, limit = 20): (MemoryRow & { project?: string })[] {
  const db = getDb()
  if (!db) return []
  const sql = `
    SELECT m.*, m.project
    FROM memories m
    JOIN memories_fts fts ON m.rowid = fts.rowid
    WHERE memories_fts MATCH ?
    ORDER BY m.weight DESC
    LIMIT ?
  `
  return db.prepare(sql).all(query, limit) as (MemoryRow & { project?: string })[]
}

export function getMemory(id: string): MemoryRow | undefined {
  const db = getDb()
  if (!db) return undefined
  return db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as MemoryRow | undefined
}

export function getMemoriesByTopic(topic: string, limit = 50): MemoryRow[] {
  const db = getDb()
  if (!db) return []
  return db.prepare('SELECT * FROM memories WHERE topic = ? ORDER BY created_at DESC LIMIT ?').all(topic, limit) as MemoryRow[]
}

export function getHealth(topic?: string): HealthResult[] {
  const db = getDb()
  if (!db) return []
  let sql = `
    SELECT
      topic,
      COUNT(*) as count,
      AVG(weight) as avg_weight,
      SUM(CASE WHEN weight < 0.3 THEN 1 ELSE 0 END) as low_weight_count,
      SUM(CASE WHEN importance = 'critical' THEN 1 ELSE 0 END) as critical_count,
      SUM(CASE WHEN importance = 'high' THEN 1 ELSE 0 END) as high_count,
      SUM(CASE WHEN importance = 'medium' THEN 1 ELSE 0 END) as medium_count,
      SUM(CASE WHEN importance = 'low' THEN 1 ELSE 0 END) as low_count
    FROM memories
  `
  const params: string[] = []
  if (topic) {
    sql += ' WHERE topic = ?'
    params.push(topic)
  }
  sql += ' GROUP BY topic ORDER BY count DESC'
  return db.prepare(sql).all(...params) as HealthResult[]
}

export interface IngestionSource {
  chunk_count: number
  last_ingested: string | null
  source_path: string
}

export function getIngestionSources(): IngestionSource[] {
  const db = getDb()
  if (!db) return []
  try {
    return db
      .prepare(
        `SELECT
          source_path,
          COUNT(*) as chunk_count,
          MAX(created_at) as last_ingested
        FROM chunks
        GROUP BY source_path
        ORDER BY last_ingested DESC`
      )
      .all() as IngestionSource[]
  } catch (err) {
    logger.debug({ err }, 'Failed to query chunks table')
    return []
  }
}

export function memoirList(): MemoirRow[] {
  const db = getDb()
  if (!db) return []
  return db.prepare('SELECT * FROM memoirs ORDER BY updated_at DESC').all() as MemoirRow[]
}

export function memoirShow(name: string): { memoir: MemoirRow; concepts: ConceptRow[] } | null {
  const db = getDb()
  if (!db) return null
  const memoir = db.prepare('SELECT * FROM memoirs WHERE name = ?').get(name) as MemoirRow | undefined
  if (!memoir) return null
  const concepts = db.prepare('SELECT * FROM concepts WHERE memoir_id = ? ORDER BY confidence DESC').all(memoir.id) as ConceptRow[]
  return { concepts, memoir }
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

  // ─────────────────────────────────────────────────────────────────────────
  // BFS traversal phase: collect links and neighbor IDs
  // ─────────────────────────────────────────────────────────────────────────

  const neighborLinks: Array<{ target_id: string; source_id: string; link: ConceptLinkRow; direction: 'outgoing' | 'incoming' }> = []
  const conceptIdsToFetch = new Set<string>()

  for (let d = 0; d < depth && frontier.length > 0; d++) {
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

  // ─────────────────────────────────────────────────────────────────────────
  // Batch fetch: fetch all concepts in a single query
  // ─────────────────────────────────────────────────────────────────────────

  if (conceptIdsToFetch.size > 0) {
    const conceptIds = Array.from(conceptIdsToFetch)
    const placeholders = conceptIds.map(() => '?').join(',')
    const allConcepts = db.prepare(`SELECT * FROM concepts WHERE id IN (${placeholders})`).all(...conceptIds) as ConceptRow[]
    const conceptMap = new Map(allConcepts.map((c) => [c.id, c]))

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

// ─────────────────────────────────────────────────────────────────────────────
// Writes: shell out to CLI
// ─────────────────────────────────────────────────────────────────────────────

const runCli = createCliRunner(process.env.HYPHAE_BIN ?? 'hyphae', 'hyphae')

export async function store(topic: string, summary: string, importance?: string, keywords?: string[]) {
  const args = ['store', '-t', topic, '-c', summary]
  if (importance) args.push('-i', importance)
  if (keywords?.length) args.push('-k', keywords.join(','))
  return runCli(args)
}

export async function forget(id: string) {
  return runCli(['forget', id])
}

export async function updateImportance(id: string, importance: string) {
  return runCli(['update', '--id', id, '--importance', importance])
}

export async function invalidateMemory(id: string, reason?: string) {
  const args = ['invalidate', '--id', id]
  if (reason) args.push('--reason', reason)
  return runCli(args)
}

export async function consolidate(topic: string, keepOriginals = false) {
  const args = ['consolidate', '-t', topic]
  if (keepOriginals) args.push('--keep-originals')
  return runCli(args)
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions Timeline
// ─────────────────────────────────────────────────────────────────────────────

export function getSessions(project?: string, limit = 20): SessionRecord[] {
  const db = getDb()
  if (!db) return []

  try {
    // Try querying sessions table if it exists
    let sql = 'SELECT * FROM sessions'
    const params: string[] = []

    if (project) {
      sql += ' WHERE project = ?'
      params.push(project)
    }

    sql += ' ORDER BY started_at DESC LIMIT ?'
    params.push(String(limit))

    return db.prepare(sql).all(...params) as SessionRecord[]
  } catch {
    // Fallback: query session/{project} topic memories
    if (!project) return []

    const memories = db
      .prepare(
        `SELECT m.* FROM memories m
         WHERE m.topic = ?
         ORDER BY m.created_at DESC
         LIMIT ?`
      )
      .all(`session/${project}`, limit) as MemoryRow[]

    return memories.map((m): SessionRecord => {
      const sourceData = m.source_data ? (JSON.parse(m.source_data) as Record<string, unknown>) : {}
      return {
        ended_at: (sourceData.ended_at as string) || null,
        errors: (sourceData.errors as string) || null,
        files_modified: (sourceData.files_modified as string) || null,
        id: m.id,
        project,
        started_at: m.created_at,
        status: (sourceData.status as string) || 'completed',
        summary: m.summary,
        task: (sourceData.task as string) || null,
      }
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lessons Extraction
// ─────────────────────────────────────────────────────────────────────────────

export function extractLessons(): Lesson[] {
  const db = getDb()
  if (!db) return []

  const lessons: Lesson[] = []
  const topicCounts = new Map<string, number>()
  const topicMemories = new Map<string, MemoryRow[]>()

  // Query corrections, errors/resolved, and tests/resolved
  const topics = ['corrections', 'errors/resolved', 'tests/resolved']

  for (const topic of topics) {
    const memories = db.prepare(`SELECT * FROM memories WHERE topic = ? ORDER BY created_at DESC LIMIT 50`).all(topic) as MemoryRow[]

    if (memories.length > 0) {
      topicCounts.set(topic, memories.length)
      topicMemories.set(topic, memories)
    }
  }

  // Extract lessons from corrections
  const corrections = topicMemories.get('corrections') || []
  const correctionGroups = new Map<string, MemoryRow[]>()

  for (const mem of corrections) {
    const keywords = mem.keywords ? (JSON.parse(mem.keywords) as string[]) : []
    const key = keywords.slice(0, 2).join('|') || mem.summary.slice(0, 20)

    let group = correctionGroups.get(key)
    if (!group) {
      group = []
      correctionGroups.set(key, group)
    }
    group.push(mem)
  }

  for (const [, items] of correctionGroups) {
    if (items.length >= 1) {
      lessons.push({
        category: 'corrections',
        description: items[0].summary,
        frequency: items.length,
        id: `correction-${lessons.length}`,
        keywords: items[0].keywords ? (JSON.parse(items[0].keywords) as string[]) : [],
        source_topics: ['corrections'],
      })
    }
  }

  // Extract lessons from resolved errors
  const resolvedErrors = topicMemories.get('errors/resolved') || []
  const errorGroups = new Map<string, MemoryRow[]>()

  for (const mem of resolvedErrors) {
    const keywords = mem.keywords ? (JSON.parse(mem.keywords) as string[]) : []
    const key = keywords[0] || mem.summary.slice(0, 30)

    let group = errorGroups.get(key)
    if (!group) {
      group = []
      errorGroups.set(key, group)
    }
    group.push(mem)
  }

  for (const [, items] of errorGroups) {
    if (items.length >= 1) {
      lessons.push({
        category: 'errors',
        description: items[0].summary,
        frequency: items.length,
        id: `error-${lessons.length}`,
        keywords: items[0].keywords ? (JSON.parse(items[0].keywords) as string[]) : [],
        source_topics: ['errors/resolved'],
      })
    }
  }

  // Extract lessons from resolved tests
  const resolvedTests = topicMemories.get('tests/resolved') || []
  const testGroups = new Map<string, MemoryRow[]>()

  for (const mem of resolvedTests) {
    const keywords = mem.keywords ? (JSON.parse(mem.keywords) as string[]) : []
    const key = keywords[0] || mem.summary.slice(0, 30)

    let group = testGroups.get(key)
    if (!group) {
      group = []
      testGroups.set(key, group)
    }
    group.push(mem)
  }

  for (const [, items] of testGroups) {
    if (items.length >= 1) {
      lessons.push({
        category: 'tests',
        description: items[0].summary,
        frequency: items.length,
        id: `test-${lessons.length}`,
        keywords: items[0].keywords ? (JSON.parse(items[0].keywords) as string[]) : [],
        source_topics: ['tests/resolved'],
      })
    }
  }

  return lessons.sort((a, b) => b.frequency - a.frequency)
}
