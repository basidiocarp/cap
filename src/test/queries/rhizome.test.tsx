import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { rhizomeApi } from '../../lib/api'
import { useProject, useProjectContextController } from '../../lib/queries/rhizome'
import { useProjectContextStore } from '../../store/project-context'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('rhizome queries', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useProjectContextStore.getState().clearProjectContext()
  })

  it('keeps useProject as a pure query hook', async () => {
    vi.spyOn(rhizomeApi, 'project').mockResolvedValue({
      active: '/projects/cap',
      recent: ['/projects/cap', '/projects/hyphae'],
    })

    const { result } = renderHook(() => useProject(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.data).toEqual({
        active: '/projects/cap',
        recent: ['/projects/cap', '/projects/hyphae'],
      })
    })

    expect(useProjectContextStore.getState()).toMatchObject({
      activeProject: null,
      recentProjects: [],
    })
  })

  it('syncs project context through useProjectContextController', async () => {
    vi.spyOn(rhizomeApi, 'project').mockResolvedValue({
      active: '/projects/cap',
      recent: ['/projects/cap', '/projects/hyphae'],
    })

    renderHook(() => useProjectContextController(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(useProjectContextStore.getState()).toMatchObject({
        activeProject: '/projects/cap',
        recentProjects: ['/projects/cap', '/projects/hyphae'],
      })
    })
  })
})
