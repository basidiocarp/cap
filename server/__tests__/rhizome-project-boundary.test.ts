import * as fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createApp } from '../index'
import { CAP_API_KEY } from '../lib/config.ts'
import { registry } from '../lib/rhizome-registry'

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    existsSync: vi.fn(),
    realpathSync: vi.fn(),
    statSync: vi.fn(),
  }
})

describe('POST /api/rhizome/project boundary', () => {
  let app: ReturnType<typeof createApp>
  let activeProject = '/projects/current'
  let recentProjects = ['/projects/current', '/projects/recent']
  const previousAllowedRoots = process.env.CAP_ALLOWED_PROJECT_ROOTS

  beforeEach(() => {
    activeProject = '/projects/current'
    recentProjects = ['/projects/current', '/projects/recent']
    app = createApp()
    vi.spyOn(registry, 'getActive').mockReturnValue({ isAvailable: () => true } as never)
    vi.spyOn(registry, 'getActiveProject').mockImplementation(() => activeProject)
    vi.spyOn(registry, 'getRecentProjects').mockImplementation(() => [...recentProjects])
    vi.spyOn(registry, 'switchProject').mockImplementation((path: string) => {
      activeProject = path
      recentProjects = [path, ...recentProjects.filter((project) => project !== path)].slice(0, 10)
      return {} as never
    })

    vi.mocked(fs.existsSync).mockImplementation(() => true)
    vi.mocked(fs.realpathSync).mockImplementation((path) => String(path))
    vi.mocked(fs.statSync).mockImplementation((path) => ({ isDirectory: () => path !== '/projects/not-a-directory' }) as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (previousAllowedRoots === undefined) {
      delete process.env.CAP_ALLOWED_PROJECT_ROOTS
    } else {
      process.env.CAP_ALLOWED_PROJECT_ROOTS = previousAllowedRoots
    }
  })

  async function postProject(path: string): Promise<Response> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (CAP_API_KEY) {
      headers.Authorization = `Bearer ${CAP_API_KEY}`
    }

    const req = new Request('http://localhost:3001/api/rhizome/project', {
      body: JSON.stringify({ path }),
      headers,
      method: 'POST',
    })
    return app.fetch(req)
  }

  it('allows the current recent project root', async () => {
    const res = await postProject('/projects/recent')

    expect(res.status).toBe(200)
    expect(registry.switchProject).toHaveBeenCalledWith('/projects/recent')
    await expect(res.json()).resolves.toMatchObject({
      active: '/projects/recent',
      recent: ['/projects/recent', '/projects/current'],
    })
  })

  it('allows an explicit CAP_ALLOWED_PROJECT_ROOTS entry', async () => {
    process.env.CAP_ALLOWED_PROJECT_ROOTS = '/projects/extra,/projects/ignored'

    const res = await postProject('/projects/extra')

    expect(res.status).toBe(200)
    expect(registry.switchProject).toHaveBeenCalledWith('/projects/extra')
  })

  it('rejects a disallowed directory path', async () => {
    const res = await postProject('/tmp/disallowed')

    expect(res.status).toBe(400)
    expect(registry.switchProject).not.toHaveBeenCalled()
    await expect(res.json()).resolves.toEqual({
      error: 'Path is not an allowed project root: /tmp/disallowed',
    })
  })

  it('still rejects non-directory paths', async () => {
    const res = await postProject('/projects/not-a-directory')

    expect(res.status).toBe(400)
    expect(registry.switchProject).not.toHaveBeenCalled()
    await expect(res.json()).resolves.toEqual({
      error: 'Path is not a directory: /projects/not-a-directory',
    })
  })
})
