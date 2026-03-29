import type { Context, Hono } from 'hono'

import { parseNumberParam, requireQuery } from '../../lib/params.ts'
import { registry } from '../../lib/rhizome-registry.ts'
import { logger } from '../../logger.ts'

export async function rhizomeTool(c: Context, tool: string, args: Record<string, unknown>): Promise<Response> {
  try {
    const result = await registry.getActive().callTool(tool, args)
    return c.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error({ err }, `Rhizome ${tool} failed`)
    return c.json({ error: message }, 500)
  }
}

export async function parseJsonBody(c: Context): Promise<Record<string, unknown> | Response> {
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ error: 'Request body must be a JSON object' }, 400)
  }
  return body as Record<string, unknown>
}

export function requiredStringField(body: Record<string, unknown>, key: string): string | Response {
  const value = body[key]
  if (typeof value !== 'string' || !value.trim()) {
    return new Response(JSON.stringify({ error: `Missing required field: ${key}` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
  return value
}

export function requiredNumberField(body: Record<string, unknown>, key: string): number | Response {
  const value = body[key]
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return new Response(JSON.stringify({ error: `Missing required field: ${key}` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
  return value
}

const NUMERIC_PARAMS = new Set(['line', 'column', 'depth'])

export function endpoint(tool: string, required: string[], optional: string[] = []) {
  return async (c: Context) => {
    const params: Record<string, unknown> = {}
    for (const key of required) {
      const val = requireQuery(c, key)
      if (val instanceof Response) return val
      params[key] = NUMERIC_PARAMS.has(key) ? Number(val) : val
    }
    for (const key of optional) {
      const val = c.req.query(key)
      if (val) params[key] = NUMERIC_PARAMS.has(key) ? Number(val) : val
    }
    return rhizomeTool(c, tool, params)
  }
}

export function numericEndpoint(tool: string, requiredStr: string[], requiredNum: string[]) {
  return async (c: Context) => {
    const params: Record<string, unknown> = {}
    for (const key of requiredStr) {
      const val = requireQuery(c, key)
      if (val instanceof Response) return val
      params[key] = val
    }
    for (const key of requiredNum) {
      const raw = requireQuery(c, key)
      if (raw instanceof Response) return raw
      const num = parseNumberParam(raw as string)
      if (num === undefined) {
        return c.json({ error: `${key} must be a valid number` }, 400)
      }
      params[key] = num
    }
    return rhizomeTool(c, tool, params)
  }
}

export function requireAvailability(app: Hono) {
  app.use('*', async (c, next) => {
    if (!registry.getActive().isAvailable()) {
      return c.json({ available: false, error: 'Rhizome not installed' }, 503)
    }
    await next()
  })
}
