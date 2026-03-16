import type { Context } from 'hono'

export function requireQuery(c: Context, name: string): string | Response {
  const value = c.req.query(name)
  if (!value) return c.json({ error: `Missing required parameter: ${name}` }, 400)
  return value
}
