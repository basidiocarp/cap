import type { Stats } from 'node:fs'
import type { Hono } from 'hono'
import { existsSync, statSync } from 'node:fs'

import { registry } from '../../lib/rhizome-registry.ts'
import { logger } from '../../logger.ts'

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
