import type { ConceptLinkRow, ConceptRow, HealthResult, MemoirRow, MemoryRow, StatsResult, TopicSummary } from './types.ts'
import { getDb } from './db.ts'
import { cached } from './lib/cache.ts'
import { createCliRunner } from './lib/cli.ts'

// Reads: direct SQLite

export function getStats(): StatsResult {
  const db = getDb()
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

export function getMemory(id: string): MemoryRow | undefined {
  const db = getDb()
  return db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as MemoryRow | undefined
}

export function getMemoriesByTopic(topic: string, limit = 50): MemoryRow[] {
  const db = getDb()
  return db.prepare('SELECT * FROM memories WHERE topic = ? ORDER BY created_at DESC LIMIT ?').all(topic, limit) as MemoryRow[]
}

export function getHealth(topic?: string): HealthResult[] {
  const db = getDb()
  let sql = `
    SELECT
      topic,
      COUNT(*) as count,
      AVG(weight) as avg_weight,
      SUM(CASE WHEN weight < 0.3 THEN 1 ELSE 0 END) as low_weight_count,
      SUM(CASE WHEN importance = 'Critical' THEN 1 ELSE 0 END) as critical_count,
      SUM(CASE WHEN importance = 'High' THEN 1 ELSE 0 END) as high_count,
      SUM(CASE WHEN importance = 'Medium' THEN 1 ELSE 0 END) as medium_count,
      SUM(CASE WHEN importance = 'Low' THEN 1 ELSE 0 END) as low_count
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

export function memoirList(): MemoirRow[] {
  const db = getDb()
  return db.prepare('SELECT * FROM memoirs ORDER BY updated_at DESC').all() as MemoirRow[]
}

export function memoirShow(name: string): { memoir: MemoirRow; concepts: ConceptRow[] } | null {
  const db = getDb()
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
  const memoir = db.prepare('SELECT * FROM memoirs WHERE name = ?').get(memoirName) as MemoirRow | undefined
  if (!memoir) return null

  const concept = db.prepare('SELECT * FROM concepts WHERE memoir_id = ? AND name = ?').get(memoir.id, conceptName) as
    | ConceptRow
    | undefined
  if (!concept) return null

  const neighbors: Array<{ concept: ConceptRow; link: ConceptLinkRow; direction: 'outgoing' | 'incoming' }> = []

  const visited = new Set<string>([concept.id])
  let frontier = [concept.id]

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
          const linkedConcept = db.prepare('SELECT * FROM concepts WHERE id = ?').get(row.target_id) as ConceptRow
          neighbors.push({
            concept: linkedConcept,
            direction: 'outgoing',
            link: {
              created_at: row.created_at,
              id: row.id,
              relation: row.relation,
              source_id: row.source_id,
              target_id: row.target_id,
              weight: row.weight,
            },
          })
        }
      }

      for (const row of incoming) {
        if (!visited.has(row.source_id)) {
          visited.add(row.source_id)
          nextFrontier.push(row.source_id)
          const linkedConcept = db.prepare('SELECT * FROM concepts WHERE id = ?').get(row.source_id) as ConceptRow
          neighbors.push({
            concept: linkedConcept,
            direction: 'incoming',
            link: {
              created_at: row.created_at,
              id: row.id,
              relation: row.relation,
              source_id: row.source_id,
              target_id: row.target_id,
              weight: row.weight,
            },
          })
        }
      }
    }
    frontier = nextFrontier
  }

  return { concept, neighbors }
}

export function memoirSearch(memoirName: string, query: string): ConceptRow[] {
  const db = getDb()
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

// Analytics (60s cache)

function computeAnalytics() {
  const db = getDb()

  const total = (db.prepare('SELECT COUNT(*) as count FROM memories').get() as { count: number }).count
  const recalled = (db.prepare('SELECT COUNT(*) as count FROM memories WHERE access_count > 0').get() as { count: number }).count
  const created_last_7d = (
    db.prepare("SELECT COUNT(*) as count FROM memories WHERE created_at > datetime('now', '-7 days')").get() as { count: number }
  ).count
  const created_last_30d = (
    db.prepare("SELECT COUNT(*) as count FROM memories WHERE created_at > datetime('now', '-30 days')").get() as { count: number }
  ).count
  const decayed = (db.prepare('SELECT COUNT(*) as count FROM memories WHERE weight < 0.3').get() as { count: number }).count

  let avg_weight = 0
  let min_weight = 0
  try {
    const weightStats = db.prepare('SELECT AVG(weight) as avg_weight, MIN(weight) as min_weight FROM memories').get() as {
      avg_weight: number | null
      min_weight: number | null
    }
    avg_weight = weightStats.avg_weight ?? 0
    min_weight = weightStats.min_weight ?? 0
  } catch {
    // fallback defaults already set
  }

  const total_memoirs = (db.prepare('SELECT COUNT(*) as count FROM memoirs').get() as { count: number }).count
  const total_concepts = (db.prepare('SELECT COUNT(*) as count FROM concepts').get() as { count: number }).count

  let code_memoirs = 0
  try {
    code_memoirs = (db.prepare("SELECT COUNT(*) as count FROM memoirs WHERE name LIKE 'code:%'").get() as { count: number }).count
  } catch {
    code_memoirs = 0
  }

  let total_links = 0
  try {
    total_links = (db.prepare('SELECT COUNT(*) as count FROM concept_links').get() as { count: number }).count
  } catch {
    total_links = 0
  }

  const top_topics = db
    .prepare(
      'SELECT topic as name, COUNT(*) as count, AVG(weight) as avg_weight, MAX(created_at) as latest_created_at FROM memories GROUP BY topic ORDER BY count DESC LIMIT 10'
    )
    .all() as { avg_weight: number; count: number; latest_created_at: string; name: string }[]

  const importance_distribution: { critical: number; ephemeral: number; high: number; low: number; medium: number } = {
    critical: 0,
    ephemeral: 0,
    high: 0,
    low: 0,
    medium: 0,
  }
  try {
    const rows = db.prepare('SELECT importance, COUNT(*) as count FROM memories GROUP BY importance').all() as {
      count: number
      importance: string
    }[]
    for (const row of rows) {
      if (row.importance in importance_distribution) {
        importance_distribution[row.importance as keyof typeof importance_distribution] = row.count
      }
    }
  } catch {
    // fallback defaults already set
  }

  return {
    importance_distribution,
    lifecycle: { avg_weight, created_last_7d, created_last_30d, decayed, min_weight, pruned: 0 },
    memoir_stats: { code_memoirs, total: total_memoirs, total_concepts, total_links },
    memory_utilization: { rate: total > 0 ? recalled / total : 0, recalled, total },
    search_stats: { empty_results: 0, hit_rate: 0, total_searches: 0 },
    top_topics,
  }
}

export const getAnalytics = cached(computeAnalytics, 60_000)

// ─────────────────────────────────────────────────────────────────────────────
// Context gathering
// ─────────────────────────────────────────────────────────────────────────────

interface ContextEntry {
  content: string
  relevance: number
  source: string
  symbol?: string
  topic?: string
}

interface GatherContextResult {
  context: ContextEntry[]
  sources_queried: string[]
  tokens_budget: number
  tokens_used: number
}

const CHARS_PER_TOKEN = 4
const MAX_PER_SOURCE = 5

function relevanceScore(position: number): number {
  return Math.max(0.1, 0.95 - position * 0.1)
}

export async function gatherContext(task: string, project?: string, budget = 2000, include?: string): Promise<GatherContextResult> {
  const db = getDb()
  const charBudget = budget * CHARS_PER_TOKEN
  const results: ContextEntry[] = []
  const sourcesQueried: string[] = []

  const sources = include ? include.split(',').map((s) => s.trim()) : ['memories', 'errors', 'sessions', 'code']

  // Memories
  if (sources.includes('memories')) {
    sourcesQueried.push('memories')
    try {
      let sql = `
        SELECT m.*
        FROM memories m
        JOIN memories_fts fts ON m.rowid = fts.rowid
        WHERE memories_fts MATCH ?
      `
      const params: (string | number)[] = [task]
      if (project) {
        sql += ' AND m.project = ?'
        params.push(project)
      }
      sql += ` ORDER BY rank LIMIT ${MAX_PER_SOURCE}`
      const rows = db.prepare(sql).all(...params) as MemoryRow[]
      for (const [idx, row] of rows.entries()) {
        results.push({
          content: row.summary,
          relevance: relevanceScore(idx),
          source: 'memory',
          topic: row.topic,
        })
      }
    } catch {
      // FTS match may fail on certain queries — skip silently
    }
  }

  // Errors
  if (sources.includes('errors')) {
    sourcesQueried.push('errors')
    try {
      let sql = `
        SELECT m.*
        FROM memories m
        JOIN memories_fts fts ON m.rowid = fts.rowid
        WHERE memories_fts MATCH ?
          AND (m.topic LIKE 'errors%' OR m.topic LIKE 'resolved%')
      `
      const params: (string | number)[] = [task]
      if (project) {
        sql += ' AND m.project = ?'
        params.push(project)
      }
      sql += ` ORDER BY rank LIMIT ${MAX_PER_SOURCE}`
      const rows = db.prepare(sql).all(...params) as MemoryRow[]
      for (const [idx, row] of rows.entries()) {
        results.push({
          content: row.summary,
          relevance: relevanceScore(idx),
          source: 'error',
          topic: row.topic,
        })
      }
    } catch {
      // skip
    }
  }

  // Sessions
  if (sources.includes('sessions')) {
    sourcesQueried.push('sessions')
    try {
      let sql = `
        SELECT m.*
        FROM memories m
        JOIN memories_fts fts ON m.rowid = fts.rowid
        WHERE memories_fts MATCH ?
          AND m.topic LIKE 'session/%'
      `
      const params: (string | number)[] = [task]
      if (project) {
        sql += ' AND m.project = ?'
        params.push(project)
      }
      sql += ` ORDER BY rank LIMIT ${MAX_PER_SOURCE}`
      const rows = db.prepare(sql).all(...params) as MemoryRow[]
      for (const [idx, row] of rows.entries()) {
        results.push({
          content: row.summary,
          relevance: relevanceScore(idx),
          source: 'session',
          topic: row.topic,
        })
      }
    } catch {
      // skip
    }
  }

  // Code (from code:{project} memoir)
  if (sources.includes('code') && project) {
    sourcesQueried.push('code')
    try {
      const memoir = db.prepare('SELECT * FROM memoirs WHERE name = ?').get(`code:${project}`) as MemoirRow | undefined
      if (memoir) {
        const concepts = db
          .prepare(
            `SELECT c.*
             FROM concepts c
             JOIN concepts_fts fts ON c.rowid = fts.rowid
             WHERE concepts_fts MATCH ? AND c.memoir_id = ?
             ORDER BY rank LIMIT ?`
          )
          .all(task, memoir.id, MAX_PER_SOURCE) as ConceptRow[]
        for (const [idx, concept] of concepts.entries()) {
          results.push({
            content: concept.definition,
            relevance: relevanceScore(idx),
            source: 'code',
            symbol: concept.name,
          })
        }
      }
    } catch {
      // skip
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance)

  // Truncate to budget
  let charsUsed = 0
  const truncated: ContextEntry[] = []

  for (const item of results) {
    const itemChars = item.content.length
    if (charsUsed + itemChars > charBudget && truncated.length > 0) {
      break
    }
    charsUsed += itemChars
    truncated.push({
      content: item.content,
      relevance: Math.round(item.relevance * 100) / 100,
      source: item.source,
      ...(item.topic ? { topic: item.topic } : {}),
      ...(item.symbol ? { symbol: item.symbol } : {}),
    })
  }

  return {
    context: truncated,
    sources_queried: sourcesQueried,
    tokens_budget: budget,
    tokens_used: Math.floor(charsUsed / CHARS_PER_TOKEN),
  }
}

// Writes: shell out to CLI

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

export async function consolidate(topic: string, keepOriginals = false) {
  const args = ['consolidate', '-t', topic]
  if (keepOriginals) args.push('--keep-originals')
  return runCli(args)
}
