import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { closeDb, computeBudgetStatus, getBudgetConfig, getCostSummary, recordCostEntry, setBudgetConfig } from '../lib/capDb.ts'

const tempDirs: string[] = []

function makeTempDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'cap-costs-test-'))
  tempDirs.push(dir)
  return join(dir, 'test.db')
}

beforeEach(() => {
  // Reset singleton and point at a fresh temp DB so tests are isolated.
  closeDb()
  process.env.CAP_DB = makeTempDbPath()
})

afterEach(() => {
  closeDb()
  delete process.env.CAP_DB

  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (dir) rmSync(dir, { force: true, recursive: true })
  }
})

describe('computeBudgetStatus', () => {
  it('returns ok when no limits are configured', () => {
    const status = computeBudgetStatus()
    expect(status.status).toBe('ok')
  })

  it('returns ok when spend is below warning threshold', () => {
    setBudgetConfig({ daily_limit_usd: 1.0, warn_at_percent: 80 })
    recordCostEntry({
      completion_tokens: 50,
      cost_usd: 0.5,
      entry_id: 'e1',
      model: 'claude-opus-4-6',
      prompt_tokens: 100,
      session_id: 's1',
    })

    const status = computeBudgetStatus()
    expect(status.status).toBe('ok')
  })

  it('returns warning when spend reaches warn_at_percent of daily limit', () => {
    setBudgetConfig({ daily_limit_usd: 1.0, warn_at_percent: 80 })
    recordCostEntry({
      completion_tokens: 50,
      cost_usd: 0.85,
      entry_id: 'e2',
      model: 'claude-opus-4-6',
      prompt_tokens: 100,
      session_id: 's1',
    })

    const status = computeBudgetStatus()
    expect(status.status).toBe('warning')
    if (status.status === 'warning') {
      expect(status.limit_usd).toBe(1.0)
      expect(status.percent).toBeGreaterThanOrEqual(80)
    }
  })

  it('returns exceeded when spend exceeds daily limit', () => {
    setBudgetConfig({ daily_limit_usd: 1.0 })
    recordCostEntry({
      completion_tokens: 50,
      cost_usd: 1.5,
      entry_id: 'e3',
      model: 'claude-opus-4-6',
      prompt_tokens: 100,
      session_id: 's1',
    })

    const status = computeBudgetStatus()
    expect(status.status).toBe('exceeded')
    if (status.status === 'exceeded') {
      expect(status.spent_usd).toBeCloseTo(1.5, 5)
      expect(status.limit_usd).toBe(1.0)
    }
  })

  it('enforces per_session_limit_usd when session_id is provided', () => {
    setBudgetConfig({ per_session_limit_usd: 0.5 })
    recordCostEntry({
      completion_tokens: 50,
      cost_usd: 0.6,
      entry_id: 'e4',
      model: 'claude-opus-4-6',
      prompt_tokens: 100,
      session_id: 'session-x',
    })

    // Without session_id — should not exceed (no daily/weekly/monthly limits set)
    const statusGlobal = computeBudgetStatus()
    expect(statusGlobal.status).toBe('ok')

    // With session_id — should detect exceeded per-session limit
    const statusSession = computeBudgetStatus('session-x')
    expect(statusSession.status).toBe('exceeded')
    if (statusSession.status === 'exceeded') {
      expect(statusSession.limit_usd).toBe(0.5)
    }
  })
})

describe('recordCostEntry + getCostSummary', () => {
  it('round-trips a cost entry into the summary', () => {
    recordCostEntry({
      completion_tokens: 100,
      cost_usd: 0.25,
      entry_id: 'round-trip-1',
      model: 'claude-sonnet-4-6',
      prompt_tokens: 200,
      session_id: 'sess-1',
    })

    const summary = getCostSummary()
    expect(summary.today_usd).toBeCloseTo(0.25, 5)
    expect(summary.week_usd).toBeCloseTo(0.25, 5)
    expect(summary.month_usd).toBeCloseTo(0.25, 5)
  })

  it('accumulates multiple entries', () => {
    for (let i = 0; i < 3; i++) {
      recordCostEntry({
        completion_tokens: 25,
        cost_usd: 0.1,
        entry_id: `entry-${i}`,
        model: 'claude-haiku-4-5',
        prompt_tokens: 50,
        session_id: 'sess-2',
      })
    }

    const summary = getCostSummary()
    expect(summary.today_usd).toBeCloseTo(0.3, 5)
  })
})

describe('getBudgetConfig + setBudgetConfig', () => {
  it('starts with null limits and 80% warn threshold', () => {
    const config = getBudgetConfig()
    expect(config.daily_limit_usd).toBeNull()
    expect(config.weekly_limit_usd).toBeNull()
    expect(config.monthly_limit_usd).toBeNull()
    expect(config.per_session_limit_usd).toBeNull()
    expect(config.warn_at_percent).toBe(80.0)
  })

  it('updates specific fields without touching others', () => {
    setBudgetConfig({ daily_limit_usd: 5.0 })
    const config = getBudgetConfig()
    expect(config.daily_limit_usd).toBe(5.0)
    expect(config.weekly_limit_usd).toBeNull()
  })
})
