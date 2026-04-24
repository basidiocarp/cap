import { homedir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'

export const CAP_DB = process.env.CAP_DB ?? join(homedir(), '.local', 'share', 'cap', 'cap.db')

export interface ConversationSession {
  session_id: string
  conversation_id: string | null
  started_at: string
  last_active_at: string
  status: string
}

export interface CostEntry {
  entry_id: string
  session_id: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  cost_usd: number
  recorded_at: string
}

export interface BudgetConfig {
  id: number
  daily_limit_usd: number | null
  weekly_limit_usd: number | null
  monthly_limit_usd: number | null
  per_session_limit_usd: number | null
  warn_at_percent: number
}

let dbInstance: Database.Database | null = null

export function openDb(): Database.Database {
  if (dbInstance && !dbInstance.open) {
    dbInstance = null
  }

  if (!dbInstance) {
    dbInstance = new Database(CAP_DB)
    initSchema(dbInstance)
  }

  return dbInstance
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

function initSchema(db: Database.Database): void {
  // Create conversation_sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversation_sessions (
      session_id TEXT PRIMARY KEY,
      conversation_id TEXT NULL,
      started_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
    );
  `)

  // Create cost_entries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cost_entries (
      entry_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      cost_usd REAL NOT NULL DEFAULT 0.0,
      recorded_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES conversation_sessions(session_id)
    );
  `)

  // Create budget_config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS budget_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      daily_limit_usd REAL NULL,
      weekly_limit_usd REAL NULL,
      monthly_limit_usd REAL NULL,
      per_session_limit_usd REAL NULL,
      warn_at_percent REAL NOT NULL DEFAULT 80.0
    );
  `)

  // Initialize budget config with defaults if empty
  const stmt = db.prepare('SELECT COUNT(*) as count FROM budget_config')
  const result = stmt.get() as { count: number }
  if (result.count === 0) {
    const insert = db.prepare(`
      INSERT INTO budget_config (id, daily_limit_usd, weekly_limit_usd, monthly_limit_usd, per_session_limit_usd, warn_at_percent)
      VALUES (1, NULL, NULL, NULL, NULL, 80.0)
    `)
    insert.run()
  }
}

export function getConversationId(sessionId: string): string | null {
  const db = openDb()
  const stmt = db.prepare('SELECT conversation_id FROM conversation_sessions WHERE session_id = ?')
  const row = stmt.get(sessionId) as { conversation_id: string | null } | undefined
  return row?.conversation_id ?? null
}

export function setConversationId(sessionId: string, conversationId: string): void {
  const db = openDb()
  const existing = db.prepare('SELECT COUNT(*) as count FROM conversation_sessions WHERE session_id = ?').get(sessionId) as {
    count: number
  }

  if (existing.count === 0) {
    const insert = db.prepare(`
      INSERT INTO conversation_sessions (session_id, conversation_id, started_at, last_active_at, status)
      VALUES (?, ?, ?, ?, 'active')
    `)
    insert.run(sessionId, conversationId, new Date().toISOString(), new Date().toISOString())
  } else {
    const update = db.prepare('UPDATE conversation_sessions SET conversation_id = ?, last_active_at = ? WHERE session_id = ?')
    update.run(conversationId, new Date().toISOString(), sessionId)
  }
}

export function recordCostEntry(entry: Omit<CostEntry, 'recorded_at'>): void {
  const db = openDb()
  const stmt = db.prepare(`
    INSERT INTO cost_entries (entry_id, session_id, model, prompt_tokens, completion_tokens, cost_usd, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(entry.entry_id, entry.session_id, entry.model, entry.prompt_tokens, entry.completion_tokens, entry.cost_usd, new Date().toISOString())
}

export function getCostSummary(): {
  today_usd: number
  week_usd: number
  month_usd: number
} {
  const db = openDb()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)

  const todayStmt = db.prepare(`
    SELECT COALESCE(SUM(cost_usd), 0) as total FROM cost_entries
    WHERE recorded_at >= ?
  `)
  const weekStmt = db.prepare(`
    SELECT COALESCE(SUM(cost_usd), 0) as total FROM cost_entries
    WHERE recorded_at >= ?
  `)
  const monthStmt = db.prepare(`
    SELECT COALESCE(SUM(cost_usd), 0) as total FROM cost_entries
    WHERE recorded_at >= ?
  `)

  const todayResult = todayStmt.get(today.toISOString()) as { total: number }
  const weekResult = weekStmt.get(weekAgo.toISOString()) as { total: number }
  const monthResult = monthStmt.get(monthAgo.toISOString()) as { total: number }

  return {
    today_usd: todayResult.total,
    week_usd: weekResult.total,
    month_usd: monthResult.total,
  }
}

export type BudgetStatus =
  | { status: 'ok'; spent_usd: number; limit_usd: number | null }
  | { status: 'warning'; spent_usd: number; limit_usd: number; percent: number }
  | { status: 'exceeded'; spent_usd: number; limit_usd: number }

export function getBudgetStatus(): BudgetStatus {
  return computeBudgetStatus()
}

export function computeBudgetStatus(): BudgetStatus {
  const config = getBudgetConfig()
  const summary = getCostSummary()

  // Check daily limit
  if (config.daily_limit_usd) {
    const percent = (summary.today_usd / config.daily_limit_usd) * 100
    if (summary.today_usd > config.daily_limit_usd) {
      return { status: 'exceeded', spent_usd: summary.today_usd, limit_usd: config.daily_limit_usd }
    }
    if (percent >= config.warn_at_percent) {
      return { status: 'warning', spent_usd: summary.today_usd, limit_usd: config.daily_limit_usd, percent }
    }
  }

  // Check weekly limit
  if (config.weekly_limit_usd) {
    const percent = (summary.week_usd / config.weekly_limit_usd) * 100
    if (summary.week_usd > config.weekly_limit_usd) {
      return { status: 'exceeded', spent_usd: summary.week_usd, limit_usd: config.weekly_limit_usd }
    }
    if (percent >= config.warn_at_percent) {
      return { status: 'warning', spent_usd: summary.week_usd, limit_usd: config.weekly_limit_usd, percent }
    }
  }

  // Check monthly limit
  if (config.monthly_limit_usd) {
    const percent = (summary.month_usd / config.monthly_limit_usd) * 100
    if (summary.month_usd > config.monthly_limit_usd) {
      return { status: 'exceeded', spent_usd: summary.month_usd, limit_usd: config.monthly_limit_usd }
    }
    if (percent >= config.warn_at_percent) {
      return { status: 'warning', spent_usd: summary.month_usd, limit_usd: config.monthly_limit_usd, percent }
    }
  }

  return { status: 'ok', spent_usd: summary.today_usd, limit_usd: config.daily_limit_usd }
}

export function getBudgetConfig(): BudgetConfig {
  const db = openDb()
  const stmt = db.prepare('SELECT * FROM budget_config WHERE id = 1')
  const row = stmt.get() as BudgetConfig
  return row || { id: 1, daily_limit_usd: null, weekly_limit_usd: null, monthly_limit_usd: null, per_session_limit_usd: null, warn_at_percent: 80 }
}

export function setBudgetConfig(config: Partial<BudgetConfig>): void {
  const db = openDb()
  const updates: string[] = []
  const values: unknown[] = []

  if (config.daily_limit_usd !== undefined) {
    updates.push('daily_limit_usd = ?')
    values.push(config.daily_limit_usd)
  }
  if (config.weekly_limit_usd !== undefined) {
    updates.push('weekly_limit_usd = ?')
    values.push(config.weekly_limit_usd)
  }
  if (config.monthly_limit_usd !== undefined) {
    updates.push('monthly_limit_usd = ?')
    values.push(config.monthly_limit_usd)
  }
  if (config.per_session_limit_usd !== undefined) {
    updates.push('per_session_limit_usd = ?')
    values.push(config.per_session_limit_usd)
  }
  if (config.warn_at_percent !== undefined) {
    updates.push('warn_at_percent = ?')
    values.push(config.warn_at_percent)
  }

  if (updates.length === 0) return

  values.push(1) // id = 1
  const stmt = db.prepare(`UPDATE budget_config SET ${updates.join(', ')} WHERE id = ?`)
  stmt.run(...values)
}
