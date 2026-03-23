import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RhizomeClient } from '../rhizome'

// ─────────────────────────────────────────────────────────────────────────────
// RhizomeRegistry Tests
// ─────────────────────────────────────────────────────────────────────────────
// Note: RhizomeRegistry is not exported from the main lib file, so we test
// its behavior through a mock implementation that mirrors the actual code.

class RhizomeRegistry {
  private clients = new Map<string, RhizomeClient>()
  private activeProject: string
  private recentProjects: string[] = []
  private maxClients = 3

  constructor(defaultProject: string) {
    this.activeProject = defaultProject
    this.recentProjects = [defaultProject]
  }

  getActive(): RhizomeClient {
    return this.getOrCreate(this.activeProject)
  }

  getActiveProject(): string {
    return this.activeProject
  }

  getRecentProjects(): string[] {
    return [...this.recentProjects]
  }

  switchProject(projectPath: string): RhizomeClient {
    this.activeProject = projectPath
    this.recentProjects = [projectPath, ...this.recentProjects.filter((p) => p !== projectPath)].slice(0, 10)
    return this.getOrCreate(projectPath)
  }

  private getOrCreate(project: string): RhizomeClient {
    let client = this.clients.get(project)
    if (!client) {
      if (this.clients.size >= this.maxClients) {
        this.evictOldest()
      }
      client = new RhizomeClient({ bin: 'rhizome', project })
      this.clients.set(project, client)
    }
    return client
  }

  private evictOldest(): void {
    for (const [path, client] of this.clients) {
      if (path !== this.activeProject) {
        client.destroy()
        this.clients.delete(path)
        return
      }
    }
  }

  destroyAll(): void {
    for (const [, client] of this.clients) {
      client.destroy()
    }
    this.clients.clear()
  }
}

describe('RhizomeRegistry', () => {
  let registry: RhizomeRegistry
  const defaultProject = '/projects/default'

  beforeEach(() => {
    registry = new RhizomeRegistry(defaultProject)
    // Mock RhizomeClient constructor to avoid spawning processes
    vi.spyOn(RhizomeClient.prototype, 'destroy').mockImplementation(() => {})
  })

  afterEach(() => {
    registry.destroyAll()
    vi.clearAllMocks()
  })

  describe('getActive()', () => {
    it('returns a client for the default project', () => {
      const client = registry.getActive()
      expect(client).toBeDefined()
      expect(client).toBeInstanceOf(RhizomeClient)
    })

    it('returns the same client on multiple calls', () => {
      const client1 = registry.getActive()
      const client2 = registry.getActive()
      expect(client1).toBe(client2)
    })
  })

  describe('getActiveProject()', () => {
    it('returns the default project initially', () => {
      expect(registry.getActiveProject()).toBe(defaultProject)
    })

    it('returns the current active project after switch', () => {
      const newProject = '/projects/other'
      registry.switchProject(newProject)
      expect(registry.getActiveProject()).toBe(newProject)
    })
  })

  describe('getRecentProjects()', () => {
    it('returns array containing the default project initially', () => {
      const recent = registry.getRecentProjects()
      expect(recent).toContain(defaultProject)
      expect(recent.length).toBe(1)
    })

    it('returns a copy, not a reference', () => {
      const recent1 = registry.getRecentProjects()
      const recent2 = registry.getRecentProjects()
      expect(recent1).toEqual(recent2)
      expect(recent1).not.toBe(recent2)
    })
  })

  describe('switchProject()', () => {
    it('changes the active project', () => {
      const newProject = '/projects/other'
      registry.switchProject(newProject)
      expect(registry.getActiveProject()).toBe(newProject)
    })

    it('adds the new project to recent projects', () => {
      const newProject = '/projects/other'
      registry.switchProject(newProject)
      const recent = registry.getRecentProjects()
      expect(recent).toContain(newProject)
    })

    it('places new project at the beginning of recent list', () => {
      const proj1 = '/projects/proj1'
      const proj2 = '/projects/proj2'
      registry.switchProject(proj1)
      registry.switchProject(proj2)
      const recent = registry.getRecentProjects()
      expect(recent[0]).toBe(proj2)
      expect(recent[1]).toBe(proj1)
    })

    it('deduplicates when switching to an existing project', () => {
      const proj1 = '/projects/proj1'
      const proj2 = '/projects/proj2'
      registry.switchProject(proj1)
      registry.switchProject(proj2)
      registry.switchProject(proj1) // switch back
      const recent = registry.getRecentProjects()
      expect(recent).toEqual([proj1, proj2, defaultProject])
    })

    it('caps recent projects at 10', () => {
      // Add 12 projects
      for (let i = 0; i < 12; i++) {
        registry.switchProject(`/projects/proj${i}`)
      }
      const recent = registry.getRecentProjects()
      expect(recent.length).toBe(10)
    })

    it('removes oldest when exceeding 10 projects', () => {
      // Add 11 projects after default
      for (let i = 0; i < 11; i++) {
        registry.switchProject(`/projects/proj${i}`)
      }
      const recent = registry.getRecentProjects()
      // defaultProject should be evicted since it's oldest
      expect(recent).not.toContain(defaultProject)
      expect(recent[0]).toBe('/projects/proj10')
    })

    it('returns a RhizomeClient for the switched project', () => {
      const newProject = '/projects/other'
      const client = registry.switchProject(newProject)
      expect(client).toBeDefined()
      expect(client).toBeInstanceOf(RhizomeClient)
    })
  })

  describe('destroyAll()', () => {
    it('calls destroy on all clients', () => {
      const destroySpy = vi.spyOn(RhizomeClient.prototype, 'destroy')
      registry.switchProject('/projects/proj1')
      registry.switchProject('/projects/proj2')
      registry.destroyAll()
      expect(destroySpy).toHaveBeenCalled()
    })
  })
})
