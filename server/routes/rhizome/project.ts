import type { Stats } from 'node:fs'
import type { Hono } from 'hono'
import { existsSync, realpathSync, statSync } from 'node:fs'
import { delimiter } from 'node:path'

import { registry } from '../../lib/rhizome-registry.ts'
import { logger } from '../../logger.ts'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseAllowedProjectRoots(raw: string | undefined): string[] {
  if (!raw) {
    return []
  }

  const separatorPattern = new RegExp(`[${escapeRegExp(delimiter)},\\n\\r]+`)
  return raw
    .split(separatorPattern)
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

function getCanonicalPath(path: string): string | null {
  try {
    return realpathSync(path)
  } catch {
    return null
  }
}

function getAllowedProjectRoots(): { canonicalRoots: Set<string>; rawRoots: Set<string> } {
  const rawRoots = new Set<string>()
  const canonicalRoots = new Set<string>()
  const roots = [registry.getActiveProject(), ...registry.getRecentProjects(), ...parseAllowedProjectRoots(process.env.CAP_ALLOWED_PROJECT_ROOTS)]

  for (const root of roots) {
    if (!root) {
      continue
    }

    rawRoots.add(root)
    const canonical = getCanonicalPath(root)
    if (canonical) {
      canonicalRoots.add(canonical)
    }
  }

  return { canonicalRoots, rawRoots }
}

function isAllowedProjectPath(path: string): boolean {
  const allowedRoots = getAllowedProjectRoots()
  if (allowedRoots.rawRoots.has(path)) {
    return true
  }

  const canonicalPath = getCanonicalPath(path)
  return canonicalPath ? allowedRoots.canonicalRoots.has(canonicalPath) : false
}

export function registerProjectRoutes(app: Hono) {
  app.get('/project', (c) => {
    return c.json({
      active: registry.getActiveProject(),
      recent: registry.getRecentProjects(),
    })
  })

  app.post('/project', async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const path = body.path
    if (!path || typeof path !== 'string') {
      return c.json({ error: 'Missing required field: path' }, 400)
    }

    if (!existsSync(path)) {
      return c.json({ error: `Path does not exist: ${path}` }, 400)
    }

    let stat: Stats
    try {
      stat = statSync(path)
    } catch {
      return c.json({ error: `Cannot access path: ${path}` }, 400)
    }

    if (!stat.isDirectory()) {
      return c.json({ error: `Path is not a directory: ${path}` }, 400)
    }

    if (!isAllowedProjectPath(path)) {
      return c.json({ error: `Path is not an allowed project root: ${path}` }, 400)
    }

    const projectMarkers = ['.git', 'package.json', 'Cargo.toml', 'pyproject.toml', 'go.mod']
    const hasMarker = projectMarkers.some((marker) => existsSync(`${path}/${marker}`))
    if (!hasMarker) {
      logger.warn({ path }, 'Switched to directory without recognized project marker')
    }

    registry.switchProject(path)
    return c.json({
      active: registry.getActiveProject(),
      recent: registry.getRecentProjects(),
    })
  })
}
