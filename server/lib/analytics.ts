import { getDb } from '../db.ts'
import { cached } from './cache.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Analytics computation
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_ANALYTICS = {
  importance_distribution: { critical: 0, ephemeral: 0, high: 0, low: 0, medium: 0 },
  lifecycle: { avg_weight: 0, created_last_7d: 0, created_last_30d: 0, decayed: 0, min_weight: 0, pruned: 0 },
  memoir_stats: { code_memoirs: 0, total: 0, total_concepts: 0, total_links: 0 },
  memory_utilization: { rate: 0, recalled: 0, total: 0 },
  search_stats: null,
  top_topics: [],
}

function computeAnalytics() {
  const db = getDb()
  if (!db) return EMPTY_ANALYTICS

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
    search_stats: null,
    top_topics,
  }
}

export const getAnalytics = cached(computeAnalytics, 60_000)
