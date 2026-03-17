import type { Context } from 'hono'

export function requireQuery(c: Context, name: string): string | Response {
  const value = c.req.query(name)
  if (!value) return c.json({ error: `Missing required parameter: ${name}` }, 400)
  return value
}

export function parseNumberParam(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function clampParam(value: string | undefined, defaultVal: number, max: number): number {
  const n = parseNumberParam(value)
  if (n === undefined) return defaultVal
  return Math.min(Math.max(1, Math.floor(n)), max)
}
