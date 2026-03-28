import type { HealthResult, MemoryRow, StatsResult, TopicSummary } from '../types.ts'
import { getDb } from '../db.ts'
import { logger } from '../logger.ts'

export interface IngestionSource {
  chunk_count: number
  last_ingested: string | null
  source_path: string
}

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
  return db
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
  return db
    .prepare(
      `SELECT m.*, m.project
       FROM memories m
       JOIN memories_fts fts ON m.rowid = fts.rowid
       WHERE memories_fts MATCH ?
       ORDER BY m.weight DESC
       LIMIT ?`
    )
    .all(query, limit) as (MemoryRow & { project?: string })[]
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
