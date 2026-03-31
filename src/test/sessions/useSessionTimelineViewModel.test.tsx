import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CommandHistory, EcosystemStatus, ProjectInfo, RhizomeStatus, SessionTimelineRecord } from '../../lib/api'
import { useSessionTimelineViewModel } from '../../pages/sessions/useSessionTimelineViewModel'
import { useProjectContextStore } from '../../store/project-context'

let mockProject: ProjectInfo | null = {
  active: '/workspace/cap',
  recent: ['/workspace/cap', '/workspace/hyphae'],
}
let mockTimeline: SessionTimelineRecord[] = []
let mockCommandHistory: CommandHistory = { commands: [], total: 0 }
let mockRhizomeStatus: RhizomeStatus = { available: true, backend: 'lsp', languages: ['typescript'] }
const mockStatus: EcosystemStatus = {
  agents: {
    claude_code: {
      adapter: { configured: false, detected: false, kind: 'hooks', label: 'Claude Code' },
      config_path: null,
      configured: false,
      detected: false,
      integration: 'hooks',
      resolved_config_path: '~/.claude/settings.json',
      resolved_config_source: 'platform_default',
    },
    codex: {
      adapter: { configured: false, detected: false, kind: 'mcp', label: 'Codex' },
      config_path: null,
      configured: false,
      detected: false,
      integration: 'mcp',
      resolved_config_path: '~/.codex/config.toml',
      resolved_config_source: 'platform_default',
    },
  },
  hooks: {
    error_count: 0,
    installed_hooks: [],
    lifecycle: [],
    recent_errors: [],
  },
  hyphae: {
    activity: {
      codex_memory_count: 0,
      last_codex_memory_at: null,
      last_session_memory_at: null,
      last_session_topic: null,
      recent_session_memory_count: 0,
    },
    available: true,
    memoirs: 0,
    memories: 0,
    version: '0.9.5',
  },
  lsps: [],
  mycelium: { available: true, version: '0.7.2' },
  project: {
    active: '/workspace/cap',
    recent: ['/workspace/cap', '/workspace/hyphae'],
  },
  rhizome: { available: true, backend: 'lsp', languages: ['typescript'] },
}

const mockProjectRefetch = vi.fn()
const mockTimelineRefetch = vi.fn()
const mockCommandHistoryRefetch = vi.fn()
const mockRhizomeRefetch = vi.fn()
const mockRefreshAll = vi.fn()
const mockRunAction = vi.fn()
const mockMutation = {
  data: undefined,
  error: null,
  isError: false,
  isPending: false,
  isSuccess: false,
}

vi.mock('../../lib/queries', () => ({
  useCommandHistory: () => ({
    data: mockCommandHistory,
    isLoading: false,
    refetch: mockCommandHistoryRefetch,
  }),
  useProjectContextController: () => ({
    data: mockProject,
    isLoading: false,
    refetch: mockProjectRefetch,
  }),
  useRhizomeStatus: () => ({
    data: mockRhizomeStatus,
    isLoading: false,
    refetch: mockRhizomeRefetch,
  }),
  useSessionTimeline: () => ({
    data: mockTimeline,
    error: null,
    isLoading: false,
    refetch: mockTimelineRefetch,
  }),
}))

vi.mock('../../lib/ecosystem-status', () => ({
  useEcosystemStatusController: () => ({
    refreshAll: mockRefreshAll,
    repairPlanQuery: { data: undefined, isLoading: false },
    statusQuery: { data: mockStatus, isLoading: false },
  }),
}))

vi.mock('../../lib/stipe-actions', () => ({
  useStipeActionController: () => ({
    actionIsRunning: () => false,
    runAction: mockRunAction,
    runStipe: mockMutation,
  }),
}))

function createWrapper(route = '/sessions') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
  }
}

describe('useSessionTimelineViewModel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    useProjectContextStore.getState().clearProjectContext()
    mockProject = {
      active: '/workspace/cap',
      recent: ['/workspace/cap', '/workspace/hyphae'],
    }
    mockTimeline = [
      {
        ended_at: '2026-03-27T12:10:00Z',
        errors: '0',
        events: [],
        files_modified: '[]',
        id: 'ses_latest',
        last_activity_at: '2026-03-27T12:10:00Z',
        outcome_count: 0,
        project: 'cap',
        recall_count: 0,
        scope: 'worker-a',
        started_at: '2026-03-27T12:00:00Z',
        status: 'completed',
        summary: 'Latest session',
        task: 'recent work',
      },
      {
        ended_at: '2026-03-27T11:10:00Z',
        errors: '0',
        events: [],
        files_modified: '[]',
        id: 'ses_older',
        last_activity_at: '2026-03-27T11:10:00Z',
        outcome_count: 0,
        project: 'cap',
        recall_count: 0,
        scope: 'worker-b',
        started_at: '2026-03-27T11:00:00Z',
        status: 'completed',
        summary: 'Older session',
        task: 'older work',
      },
    ]
    mockCommandHistory = { commands: [], total: 0 }
    mockRhizomeStatus = { available: true, backend: 'lsp', languages: ['typescript'] }
    mockProjectRefetch.mockReset()
    mockTimelineRefetch.mockReset()
    mockCommandHistoryRefetch.mockReset()
    mockRhizomeRefetch.mockReset()
    mockRefreshAll.mockReset()
    mockRunAction.mockReset()
  })

  it('selects the latest session when the route requests detail=latest', async () => {
    const { result } = renderHook(() => useSessionTimelineViewModel(), {
      wrapper: createWrapper('/sessions?detail=latest'),
    })

    await waitFor(() => {
      expect(result.current.selectedSession?.id).toBe('ses_latest')
    })
  })

  it('selects the requested session from the URL when present', async () => {
    const { result } = renderHook(() => useSessionTimelineViewModel(), {
      wrapper: createWrapper('/sessions?session=ses_older'),
    })

    await waitFor(() => {
      expect(result.current.selectedSession?.id).toBe('ses_older')
    })
  })

  it('selects the requested session when the URL uses the runtime session id', async () => {
    mockTimeline = [
      {
        ended_at: '2026-03-27T12:10:00Z',
        errors: '0',
        events: [],
        files_modified: '[]',
        id: 'ses_internal',
        last_activity_at: '2026-03-27T12:10:00Z',
        outcome_count: 0,
        project: 'cap',
        recall_count: 0,
        runtime_session_id: 'claude-session-42',
        scope: 'worker-a',
        started_at: '2026-03-27T12:00:00Z',
        status: 'completed',
        summary: 'Runtime-addressable session',
        task: 'recent work',
      },
    ]

    const { result } = renderHook(() => useSessionTimelineViewModel(), {
      wrapper: createWrapper('/sessions?session=claude-session-42'),
    })

    await waitFor(() => {
      expect(result.current.selectedSession?.id).toBe('ses_internal')
    })
  })

  it('opens, closes, and refreshes the timeline state through controller actions', async () => {
    const { result } = renderHook(() => useSessionTimelineViewModel(), {
      wrapper: createWrapper('/sessions'),
    })

    expect(result.current.selectedSession).toBeNull()

    await act(async () => {
      result.current.openSessionDetail('ses_older')
    })

    await waitFor(() => {
      expect(result.current.selectedSession?.id).toBe('ses_older')
    })

    await act(async () => {
      result.current.closeSessionDetail()
    })

    await waitFor(() => {
      expect(result.current.selectedSession).toBeNull()
    })

    await act(async () => {
      result.current.refreshView()
    })

    expect(mockRefreshAll).toHaveBeenCalledTimes(1)
    expect(mockProjectRefetch).toHaveBeenCalledTimes(1)
    expect(mockTimelineRefetch).toHaveBeenCalledTimes(1)
    expect(mockCommandHistoryRefetch).toHaveBeenCalledTimes(1)
    expect(mockRhizomeRefetch).toHaveBeenCalledTimes(1)
  })
})
