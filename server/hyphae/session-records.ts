import type { MemoryRow, SessionRecord } from '../types.ts'
import { getDb } from '../db.ts'

function hasTable(name: string): boolean {
  const db = getDb()
  if (!db) return false

  try {
    const row = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) as { count: number }
    return row.count > 0
  } catch {
    return false
  }
}

function queryLegacySessionMemories(project: string, limit: number): SessionRecord[] {
  const db = getDb()
  if (!db) return []

  const memories = db
    .prepare(
      `SELECT m.* FROM memories m
       WHERE m.topic = ?
       ORDER BY m.created_at DESC
       LIMIT ?`
    )
    .all(`session/${project}`, limit) as MemoryRow[]

  return memories.map((memory): SessionRecord => {
    const sourceData = memory.source_data ? (JSON.parse(memory.source_data) as Record<string, unknown>) : {}
    return {
      ended_at: (sourceData.ended_at as string) || null,
      errors: (sourceData.errors as string) || null,
      files_modified: (sourceData.files_modified as string) || null,
      id: memory.id,
      project,
      scope: null,
      started_at: memory.created_at,
      status: (sourceData.status as string) || 'completed',
      summary: memory.summary,
      task: (sourceData.task as string) || null,
    }
  })
}

export function querySessions(project?: string, limit = 20): SessionRecord[] {
  const db = getDb()
  if (!db) return []

  try {
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
    if (!project || !hasTable('memories')) return []
    return queryLegacySessionMemories(project, limit)
  }
}

export function sessionLastActivity(session: SessionRecord, activityTimestamps: string[]): string {
  const timestamps = [session.started_at, session.ended_at, ...activityTimestamps].filter((value): value is string => Boolean(value))

  return timestamps.reduce((latest, value) => {
    if (!latest) return value
    return new Date(value).getTime() > new Date(latest).getTime() ? value : latest
  }, session.started_at)
}

export function tableExists(name: string): boolean {
  return hasTable(name)
}
