import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import type { ProjectInfo } from '../lib/types'

interface ProjectContextFallback {
  active: string
  recent: string[]
}

export interface ProjectContextState {
  activeProject: string | null
  pendingProject: string | null
  recentProjects: string[]
}

export interface ProjectContextActions {
  clearProjectContext: () => void
  failProjectSwitch: () => void
  finishProjectSwitch: (project: ProjectInfo) => void
  startProjectSwitch: (path: string) => void
  syncProject: (project: ProjectInfo) => void
}

export type ProjectContextStore = ProjectContextState & ProjectContextActions

function normalizeRecentProjects(activeProject: string | null, recentProjects: string[]): string[] {
  const deduped = [...new Set([activeProject, ...recentProjects].filter((project): project is string => Boolean(project)))]
  if (!activeProject) return deduped
  return [activeProject, ...deduped.filter((project) => project !== activeProject)]
}

function buildSnapshot(state: ProjectContextState, fallback?: ProjectContextFallback | null) {
  const activeProject = state.pendingProject ?? state.activeProject ?? fallback?.active ?? null
  const recentProjects = state.recentProjects.length > 0 ? state.recentProjects : (fallback?.recent ?? [])

  return {
    activeProject,
    isSwitchingProject: state.pendingProject !== null,
    recentProjects: normalizeRecentProjects(activeProject, recentProjects),
  }
}

export const useProjectContextStore = create<ProjectContextStore>()(
  subscribeWithSelector((set) => ({
    activeProject: null,
    clearProjectContext: () => {
      set({ activeProject: null, pendingProject: null, recentProjects: [] })
    },
    failProjectSwitch: () => {
      set({ pendingProject: null })
    },
    finishProjectSwitch: (project) => {
      set({
        activeProject: project.active,
        pendingProject: null,
        recentProjects: normalizeRecentProjects(project.active, project.recent),
      })
    },
    pendingProject: null,
    recentProjects: [],
    startProjectSwitch: (path) => {
      set({ pendingProject: path })
    },
    syncProject: (project) => {
      set((state) => {
        const recentProjects = normalizeRecentProjects(project.active, project.recent)
        if (
          state.activeProject === project.active &&
          state.pendingProject === null &&
          state.recentProjects.join('\n') === recentProjects.join('\n')
        ) {
          return state
        }

        return {
          activeProject: project.active,
          pendingProject: null,
          recentProjects,
        }
      })
    },
  }))
)

export function useProjectContextView(fallback?: ProjectContextFallback | null) {
  const activeProject = useProjectContextStore((state) => state.activeProject)
  const pendingProject = useProjectContextStore((state) => state.pendingProject)
  const recentProjects = useProjectContextStore((state) => state.recentProjects)

  const snapshot = buildSnapshot(
    {
      activeProject,
      pendingProject,
      recentProjects,
    },
    fallback
  )

  return snapshot
}
