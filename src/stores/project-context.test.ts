import { beforeEach, describe, expect, it } from 'vitest'

import { useProjectContextStore } from './project-context'

describe('project context store', () => {
  beforeEach(() => {
    useProjectContextStore.getState().clearProjectContext()
  })

  it('syncs the active project and recent list from the server payload', () => {
    useProjectContextStore.getState().syncProject({
      active: '/projects/current',
      recent: ['/projects/current', '/projects/other', '/projects/current'],
    })

    expect(useProjectContextStore.getState()).toMatchObject({
      activeProject: '/projects/current',
      pendingProject: null,
      recentProjects: ['/projects/current', '/projects/other'],
    })
  })

  it('keeps the current project while a switch is pending', () => {
    useProjectContextStore.getState().syncProject({
      active: '/projects/current',
      recent: ['/projects/current', '/projects/other'],
    })

    useProjectContextStore.getState().startProjectSwitch('/projects/next')

    expect(useProjectContextStore.getState()).toMatchObject({
      activeProject: '/projects/current',
      pendingProject: '/projects/next',
      recentProjects: ['/projects/current', '/projects/other'],
    })
  })

  it('clears the pending project after a failed switch', () => {
    useProjectContextStore.getState().syncProject({
      active: '/projects/current',
      recent: ['/projects/current'],
    })

    useProjectContextStore.getState().startProjectSwitch('/projects/missing')
    useProjectContextStore.getState().failProjectSwitch()

    expect(useProjectContextStore.getState()).toMatchObject({
      activeProject: '/projects/current',
      pendingProject: null,
      recentProjects: ['/projects/current'],
    })
  })
})
