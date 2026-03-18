import { RhizomeClient } from '../rhizome.ts'
import { RHIZOME_BIN, RHIZOME_PROJECT } from './config.ts'

// ─────────────────────────────────────────────────────────────────────────────
// RhizomeRegistry
// ─────────────────────────────────────────────────────────────────────────────

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
    // Add to recent, deduplicate, cap at 10
    this.recentProjects = [
      projectPath,
      ...this.recentProjects.filter((p) => p !== projectPath),
    ].slice(0, 10)
    return this.getOrCreate(projectPath)
  }

  private getOrCreate(project: string): RhizomeClient {
    let client = this.clients.get(project)
    if (!client) {
      // Evict oldest if at capacity
      if (this.clients.size >= this.maxClients) {
        this.evictOldest()
      }
      client = new RhizomeClient({ bin: RHIZOME_BIN, project })
      this.clients.set(project, client)
    }
    return client
  }

  private evictOldest(): void {
    // Evict least recently used that isn't the active project
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

export const registry = new RhizomeRegistry(RHIZOME_PROJECT)
