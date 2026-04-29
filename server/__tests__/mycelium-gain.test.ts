import { describe, expect, it } from 'vitest'

import { isGainCliOutput } from '../mycelium/gain.ts'

describe('mycelium gain validators', () => {
  const basePayload = {
    by_command: [
      {
        avg_savings_pct: 15.0,
        command: 'read',
        count: 50,
        exec_time_ms: 1000,
        input_tokens: 25000,
        tokens_saved: 5000,
      },
    ],
    schema_version: '1.0' as const,
    summary: {
      avg_savings_pct: 10.5,
      avg_time_ms: 250,
      total_commands: 100,
      total_input: 50000,
      total_output: 25000,
      total_saved: 12500,
      total_time_ms: 25000,
    },
  }

  const validMonthlyEntry = {
    avg_time_ms: 280,
    commands: 85,
    date: '2026-04-01',
    input_tokens: 42500,
    output_tokens: 21250,
    saved_tokens: 10625,
    savings_pct: 20.0,
    total_time_ms: 23800,
  }

  const validWeeklyEntry = {
    avg_time_ms: 300,
    commands: 20,
    date: '2026-04-21',
    input_tokens: 10000,
    output_tokens: 5000,
    saved_tokens: 2500,
    savings_pct: 20.0,
    total_time_ms: 6000,
  }

  it('passes with valid weekly array', () => {
    const payload = {
      ...basePayload,
      weekly: [validWeeklyEntry],
    }
    expect(isGainCliOutput(payload)).toBe(true)
  })

  it('passes with valid monthly array', () => {
    const payload = {
      ...basePayload,
      monthly: [validMonthlyEntry],
    }
    expect(isGainCliOutput(payload)).toBe(true)
  })

  it('passes with valid weekly and monthly arrays together', () => {
    const payload = {
      ...basePayload,
      monthly: [validMonthlyEntry],
      weekly: [validWeeklyEntry],
    }
    expect(isGainCliOutput(payload)).toBe(true)
  })

  it('returns false when weekly array contains invalid item missing required field', () => {
    const invalidEntry = { ...validWeeklyEntry }
    delete (invalidEntry as Partial<typeof validWeeklyEntry>).date
    const payload = {
      ...basePayload,
      weekly: [invalidEntry],
    }
    expect(isGainCliOutput(payload)).toBe(false)
  })

  it('returns false when weekly array contains item with wrong type', () => {
    const invalidEntry = { ...validWeeklyEntry, commands: 'not-a-number' }
    const payload = {
      ...basePayload,
      weekly: [invalidEntry],
    }
    expect(isGainCliOutput(payload)).toBe(false)
  })

  it('returns false when monthly array contains invalid item missing required field', () => {
    const invalidEntry = { ...validMonthlyEntry }
    delete (invalidEntry as Partial<typeof validMonthlyEntry>).saved_tokens
    const payload = {
      ...basePayload,
      monthly: [invalidEntry],
    }
    expect(isGainCliOutput(payload)).toBe(false)
  })

  it('passes when weekly and monthly are both absent (regression)', () => {
    expect(isGainCliOutput(basePayload)).toBe(true)
  })
})
