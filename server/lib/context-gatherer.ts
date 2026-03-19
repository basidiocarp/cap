import type { ConceptRow, MemoirRow, MemoryRow } from '../types.ts'
import { getDb } from '../db.ts'
import { logger } from '../logger.ts'

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

// ─────────────────────────────────────────────────────────────────────────────
// Unified source pattern
// ─────────────────────────────────────────────────────────────────────────────

interface SourceConfig {
  extraWhere?: string
  name: string
  sourceLabel: string
}

const MEMORY_SOURCES: SourceConfig[] = [
  { name: 'memories', sourceLabel: 'memory' },
  { extraWhere: "AND (m.topic LIKE 'errors%' OR m.topic LIKE 'resolved%')", name: 'errors', sourceLabel: 'error' },
  { extraWhere: "AND m.topic LIKE 'session/%'", name: 'sessions', sourceLabel: 'session' },
]

function queryMemorySource(task: string, project: string | undefined, config: SourceConfig): ContextEntry[] {
  const db = getDb()
  if (!db) return []
  const results: ContextEntry[] = []

  let sql = `
    SELECT m.*
    FROM memories m
    JOIN memories_fts fts ON m.rowid = fts.rowid
    WHERE memories_fts MATCH ?
  `
  const params: (string | number)[] = [task]

  if (config.extraWhere) {
    sql += ` ${config.extraWhere}`
  }
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
      source: config.sourceLabel,
      topic: row.topic,
    })
  }

  return results
}

function queryCodeSource(task: string, project: string): ContextEntry[] {
  const db = getDb()
  if (!db) return []
  const results: ContextEntry[] = []

  const memoir = db.prepare('SELECT * FROM memoirs WHERE name = ?').get(`code:${project}`) as MemoirRow | undefined
  if (!memoir) return results

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

  return results
}

export async function gatherContext(task: string, project?: string, budget = 2000, include?: string): Promise<GatherContextResult> {
  const charBudget = budget * CHARS_PER_TOKEN
  const results: ContextEntry[] = []
  const sourcesQueried: string[] = []

  const sources = include ? include.split(',').map((s) => s.trim()) : ['memories', 'errors', 'sessions', 'code']

  // Memory-based sources (unified pattern)
  for (const config of MEMORY_SOURCES) {
    if (!sources.includes(config.name)) continue
    sourcesQueried.push(config.name)
    try {
      const entries = queryMemorySource(task, project, config)
      results.push(...entries)
    } catch (err) {
      logger.debug({ err, source: config.name }, 'Context source failed')
    }
  }

  // Code (from code:{project} memoir)
  if (sources.includes('code') && project) {
    sourcesQueried.push('code')
    try {
      const entries = queryCodeSource(task, project)
      results.push(...entries)
    } catch (err) {
      logger.debug({ err, source: 'code' }, 'Context source failed')
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
