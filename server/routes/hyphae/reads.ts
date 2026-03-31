import { Hono } from 'hono'

import * as hyphae from '../../hyphae.ts'
import { clampParam, requireQuery } from '../../lib/params.ts'

const app = new Hono()

function validateIdentityQuery(project?: string, projectRoot?: string, worktreeId?: string): Response | undefined {
  const hasProjectRoot = Boolean(projectRoot)
  const hasWorktreeId = Boolean(worktreeId)

  if (hasProjectRoot !== hasWorktreeId) {
    return Response.json({ error: 'project_root and worktree_id must be provided together' }, { status: 400 })
  }

  if (!project && hasProjectRoot) {
    return Response.json({ error: 'project is required when project_root and worktree_id are provided' }, { status: 400 })
  }

  return undefined
}

app.get('/stats', async (c) => {
  try {
    return c.json(await hyphae.getStats())
  } catch {
    return c.json({ error: 'Hyphae stats unavailable' }, 502)
  }
})

app.get('/topics', async (c) => {
  try {
    return c.json(await hyphae.getTopics())
  } catch {
    return c.json({ error: 'Hyphae topics unavailable' }, 502)
  }
})

app.get('/topics/:topic/memories', async (c) => {
  const clampedLimit = clampParam(c.req.query('limit'), 20, 200)
  try {
    return c.json(await hyphae.getMemoriesByTopic(c.req.param('topic'), clampedLimit))
  } catch {
    return c.json({ error: 'Hyphae topic memories unavailable' }, 502)
  }
})

app.get('/recall', async (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  const clampedLimit = clampParam(c.req.query('limit'), 20, 200)
  try {
    return c.json(await hyphae.recall(query, c.req.query('topic') ?? undefined, clampedLimit))
  } catch {
    return c.json({ error: 'Hyphae recall unavailable' }, 502)
  }
})

app.get('/search-global', async (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  try {
    return c.json(await hyphae.searchGlobal(query, clampParam(c.req.query('limit'), 20, 200)))
  } catch {
    return c.json({ error: 'Hyphae search unavailable' }, 502)
  }
})

app.get('/memories/:id', async (c) => {
  try {
    const memory = await hyphae.getMemory(c.req.param('id'))
    if (!memory) return c.json({ error: 'Not found' }, 404)
    return c.json(memory)
  } catch {
    return c.json({ error: 'Hyphae memory lookup unavailable' }, 502)
  }
})

app.get('/health', async (c) => {
  try {
    return c.json(await hyphae.getHealth(c.req.query('topic') ?? undefined))
  } catch {
    return c.json({ error: 'Hyphae health unavailable' }, 502)
  }
})
app.get('/memoirs', async (c) => {
  try {
    return c.json(await hyphae.memoirList())
  } catch {
    return c.json({ error: 'Hyphae memoir list unavailable' }, 502)
  }
})

app.get('/memoirs/search-all', async (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  try {
    return c.json(await hyphae.memoirSearchAll(query))
  } catch {
    return c.json({ error: 'Hyphae memoir search unavailable' }, 502)
  }
})

app.get('/memoirs/:name', async (c) => {
  const clampedLimit = clampParam(c.req.query('limit'), 200, 500)
  const parsedOffset = Number(c.req.query('offset'))
  const clampedOffset = Number.isFinite(parsedOffset) ? Math.max(0, Math.floor(parsedOffset)) : 0
  try {
    const data = await hyphae.memoirShow(c.req.param('name'), {
      limit: clampedLimit,
      offset: clampedOffset,
      q: c.req.query('q') ?? undefined,
    })
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
  } catch {
    return c.json({ error: 'Hyphae memoir detail unavailable' }, 502)
  }
})

app.get('/memoirs/:name/inspect/:concept', async (c) => {
  try {
    const data = await hyphae.memoirInspect(c.req.param('name'), c.req.param('concept'), clampParam(c.req.query('depth'), 2, 5))
    if (!data) return c.json({ error: 'Not found' }, 404)
    return c.json(data)
  } catch {
    return c.json({ error: 'Hyphae memoir inspect unavailable' }, 502)
  }
})

app.get('/memoirs/:name/search', async (c) => {
  const query = requireQuery(c, 'q')
  if (query instanceof Response) return query
  try {
    return c.json(await hyphae.memoirSearch(c.req.param('name'), query))
  } catch {
    return c.json({ error: 'Hyphae memoir search unavailable' }, 502)
  }
})

app.get('/sessions', async (c) => {
  const clampedLimit = clampParam(c.req.query('limit'), 20, 200)
  const project = c.req.query('project') ?? undefined
  const projectRoot = c.req.query('project_root') ?? undefined
  const worktreeId = c.req.query('worktree_id') ?? undefined
  const scope = c.req.query('scope') ?? undefined

  const identityError = validateIdentityQuery(project, projectRoot, worktreeId)
  if (identityError) return identityError

  try {
    const sessions = await hyphae.getSessions({ project, projectRoot, scope, worktreeId }, clampedLimit)
    return c.json(sessions)
  } catch {
    return c.json({ error: 'Hyphae session list unavailable' }, 502)
  }
})

app.get('/sessions/timeline', async (c) => {
  const clampedLimit = clampParam(c.req.query('limit'), 20, 200)
  const project = c.req.query('project') ?? undefined
  const projectRoot = c.req.query('project_root') ?? undefined
  const worktreeId = c.req.query('worktree_id') ?? undefined
  const scope = c.req.query('scope') ?? undefined

  const identityError = validateIdentityQuery(project, projectRoot, worktreeId)
  if (identityError) return identityError

  try {
    const timeline = await hyphae.getSessionTimeline({ project, projectRoot, scope, worktreeId }, clampedLimit)
    return c.json(timeline)
  } catch {
    return c.json({ error: 'Hyphae session timeline unavailable' }, 502)
  }
})

app.get('/lessons', async (c) => {
  try {
    return c.json(await hyphae.getLessons())
  } catch {
    return c.json({ error: 'Hyphae lessons unavailable' }, 502)
  }
})

app.get('/analytics', async (c) => {
  try {
    return c.json(await hyphae.getAnalytics())
  } catch {
    return c.json({ error: 'Hyphae analytics unavailable' }, 502)
  }
})
app.get('/sources', async (c) => {
  try {
    return c.json(await hyphae.getIngestionSources())
  } catch {
    return c.json({ error: 'Hyphae sources unavailable' }, 502)
  }
})

app.get('/context', async (c) => {
  const task = requireQuery(c, 'task')
  if (task instanceof Response) return task
  const project = c.req.query('project') ?? undefined
  const projectRoot = c.req.query('project_root') ?? undefined
  const worktreeId = c.req.query('worktree_id') ?? undefined
  const scope = c.req.query('scope') ?? undefined

  const identityError = validateIdentityQuery(project, projectRoot, worktreeId)
  if (identityError) return identityError

  try {
    const result = await hyphae.gatherContext(task, {
      budget: clampParam(c.req.query('budget'), 2000, 50000),
      include: c.req.query('include') ?? undefined,
      project,
      projectRoot,
      scope,
      worktreeId,
    })
    return c.json(result)
  } catch {
    return c.json({ error: 'Hyphae gather-context unavailable' }, 502)
  }
})

export default app
